<?php
// src/Controller/TiendaApiController.php
namespace App\Controller;

use App\Entity\Carro;
use App\Entity\CarroProducto;
use App\Entity\Categoria;
use App\Entity\Producto;
use App\Entity\Usuario;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\Routing\Attribute\Route;

class TiendaApiController extends AbstractController
{
    #[Route('/api/login', name: 'api_login', methods: ['POST'])]
    public function login(Request $request, EntityManagerInterface $em): JsonResponse
    {
        try {
            $email = trim((string)$request->request->get('usuario', ''));
            $clave = (string)$request->request->get('clave', '');

            if ($email === '' || $clave === '') {
                return new JsonResponse([
                    'login' => false,
                    'mensaje' => 'Usuario y contraseña son requeridos.'
                ]);
            }

            $usuario = $em->getRepository(Usuario::class)->findOneBy([
                'gmail' => $email,
                'clave' => $clave
            ]);

            if (!$usuario) {
                return new JsonResponse([
                    'login' => false,
                    'mensaje' => 'Usuario o contraseña incorrectos.'
                ]);
            }

            $session = $request->getSession();
            $session->set('usuario', [
                'gmail' => $usuario->getGmail(),
                'nombre' => $usuario->getNombre(),
            ]);

            $carro = $em->getRepository(Carro::class)->findOneBy([
                'usuarioGmail' => $usuario->getGmail(),
                'enviado' => false,
            ]);

            if (!$carro) {
                $carro = new Carro();
                $carro->setUsuarioGmail($usuario->getGmail());
                $carro->setFecha(new \DateTime());
                $carro->setTotal('0.00');
                $carro->setEnviado(false);
                $em->persist($carro);
                $em->flush();
                $session->set('CodCarro', $carro->getId());
                $session->set('carrito', []);
            } else {
                $session->set('CodCarro', $carro->getId());
                $session->set('carrito', $this->buildCartFromDb($em, $carro));
            }

            $cart = $this->getCart($session);

            return new JsonResponse([
                'login' => true,
                'nombre' => $usuario->getNombre(),
                'num_productos' => count($cart),
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'login' => false,
                'mensaje' => 'Error en el servidor: ' . $e->getMessage(),
            ], 500);
        }
    }

    #[Route('/api/logout', name: 'api_logout', methods: ['GET', 'POST'])]
    public function logout(Request $request): JsonResponse
    {
        $session = $request->getSession();
        $session->clear();
        $session->invalidate();

        return new JsonResponse(['status' => 'ok']);
    }

    #[Route('/api/sesion', name: 'api_sesion', methods: ['GET'])]
    public function comprobarSesion(Request $request, EntityManagerInterface $em): JsonResponse
    {
        try {
            $session = $request->getSession();
            $usuarioSesion = $session->get('usuario');

            if (!$usuarioSesion || !isset($usuarioSesion['gmail'])) {
                return new JsonResponse(['logueado' => false]);
            }

            $usuario = $em->getRepository(Usuario::class)->findOneBy([
                'gmail' => $usuarioSesion['gmail']
            ]);

            if (!$usuario) {
                return new JsonResponse(['logueado' => false]);
            }

            $carro = $this->getOrCreateCarro($em, $session, $usuario);
            $cart = $this->getCart($session);

            return new JsonResponse([
                'logueado' => true,
                'email' => $usuario->getGmail(),
                'nombre' => $usuario->getNombre(),
                'num_productos' => count($cart),
                'codCarro' => $carro->getId(),
            ]);
        } catch (\Exception $e) {
            return new JsonResponse(['logueado' => false, 'error' => $e->getMessage()], 500);
        }
    }

    #[Route('/api/categorias', name: 'api_categorias', methods: ['GET'])]
    public function categorias(EntityManagerInterface $em): JsonResponse
    {
        $categorias = $em->getRepository(Categoria::class)->findAll();
        $data = [];

        foreach ($categorias as $categoria) {
            $data[] = [
                'CodCat' => $categoria->getId(),
                'Nombre' => $categoria->getNombre(),
            ];
        }

        return new JsonResponse($data);
    }

    #[Route('/api/productos', name: 'api_productos', methods: ['GET'])]
    public function productos(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $catId = $request->query->get('catID');
        if (!$catId) {
            return new JsonResponse([]);
        }

        $categoria = $em->getRepository(Categoria::class)->find((int)$catId);
        if (!$categoria) {
            return new JsonResponse([]);
        }

        $productos = $em->getRepository(Producto::class)->findBy([
            'categoria' => $categoria,
        ]);

        $data = [];
        foreach ($productos as $producto) {
            $data[] = [
                'CodProd' => $producto->getId(),
                'Nombre' => $producto->getNombre(),
                'Descripcion' => $producto->getDescripcion(),
                'Stock' => $producto->getStock(),
                'Precio' => $producto->getPrecio(),
            ];
        }

        return new JsonResponse($data);
    }

    #[Route('/api/carro', name: 'api_carro', methods: ['GET'])]
    public function carro(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $session = $request->getSession();
        $cart = $this->getCart($session);

        if (empty($cart)) {
            return new JsonResponse([
                'productos' => [],
                'total' => 0.00,
            ]);
        }

        $totalCarrito = 0.00;
        $productosRespuesta = [];

        foreach ($cart as $codProd => $unidades) {
            $producto = $em->getRepository(Producto::class)->find((int)$codProd);
            if (!$producto) {
                continue;
            }

            $precio = (float)$producto->getPrecio();
            $unidadesInt = (int)$unidades;
            $precioTotal = $precio * $unidadesInt;

            $totalCarrito += $precioTotal;

            $productosRespuesta[] = [
                'CodProd' => $producto->getId(),
                'Nombre' => $producto->getNombre(),
                'Descripcion' => $producto->getDescripcion(),
                'Stock' => $producto->getStock(),
                'Precio' => $producto->getPrecio(),
                'unidades_compra' => $unidadesInt,
                'precio' => $precio,
                'precio_total' => round($precioTotal, 2),
            ];
        }

        return new JsonResponse([
            'productos' => $productosRespuesta,
            'total' => round($totalCarrito, 2),
        ]);
    }

    #[Route('/api/carro/anadir', name: 'api_carro_anadir', methods: ['POST'])]
    public function anadirCarro(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $session = $request->getSession();
        $usuarioSesion = $session->get('usuario');

        if (!$usuarioSesion || !isset($usuarioSesion['gmail'])) {
            return new JsonResponse(['exito' => false, 'error' => 'Sesión no válida.']);
        }

        $codProd = (int)$request->request->get('id', 0);
        $cantidad = (int)$request->request->get('cantidad', 0);

        if ($codProd < 1 || $cantidad < 1) {
            return new JsonResponse(['exito' => false, 'error' => 'Faltan datos.']);
        }

        $producto = $em->getRepository(Producto::class)->find($codProd);
        if (!$producto) {
            return new JsonResponse(['exito' => false, 'error' => 'Producto no encontrado.']);
        }

        $stockDisponible = (int)$producto->getStock();
        $cart = $this->getCart($session);
        $cantidadActual = $cart[$codProd] ?? 0;
        $nuevaCantidad = $cantidadActual + $cantidad;

        if ($nuevaCantidad > $stockDisponible) {
            return new JsonResponse([
                'exito' => false,
                'error' => 'No hay suficiente stock. Disponibles: ' . $stockDisponible . ', solicitadas: ' . $nuevaCantidad,
            ]);
        }

        $usuario = $em->getRepository(Usuario::class)->findOneBy([
            'gmail' => $usuarioSesion['gmail'],
        ]);
        if (!$usuario) {
            return new JsonResponse(['exito' => false, 'error' => 'Usuario no válido.']);
        }

        $carro = $this->getOrCreateCarro($em, $session, $usuario);
        $carroProductoRepo = $em->getRepository(CarroProducto::class);
        $carroProducto = $carroProductoRepo->findOneBy([
            'carro' => $carro,
            'producto' => $producto,
        ]);

        if (!$carroProducto) {
            $carroProducto = new CarroProducto();
            $carroProducto->setCarro($carro);
            $carroProducto->setProducto($producto);
            $carroProducto->setUnidades($cantidad);
            $em->persist($carroProducto);
        } else {
            $carroProducto->setUnidades($nuevaCantidad);
        }

        $cart[$codProd] = $nuevaCantidad;
        $this->setCart($session, $cart);

        $nuevoTotal = $this->actualizarTotalCarro($em, $carro, $cart);
        $em->flush();

        return new JsonResponse([
            'exito' => true,
            'nuevoTotal' => $nuevoTotal,
            'cantidadProductos' => count($cart),
        ]);
    }

    #[Route('/api/carro/decrementar', name: 'api_carro_decrementar', methods: ['POST'])]
    public function decrementarCarro(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $session = $request->getSession();
        $usuarioSesion = $session->get('usuario');

        if (!$usuarioSesion || !isset($usuarioSesion['gmail'])) {
            return new JsonResponse(['exito' => false, 'error' => 'Sesión no válida.']);
        }

        $codProd = (int)$request->request->get('id', 0);
        if ($codProd < 1) {
            return new JsonResponse(['exito' => false, 'error' => 'Faltan datos.']);
        }

        $cart = $this->getCart($session);
        if (!isset($cart[$codProd]) || $cart[$codProd] < 1) {
            return new JsonResponse(['exito' => false, 'error' => 'Producto no encontrado en el carrito.']);
        }

        $usuario = $em->getRepository(Usuario::class)->findOneBy([
            'gmail' => $usuarioSesion['gmail'],
        ]);
        if (!$usuario) {
            return new JsonResponse(['exito' => false, 'error' => 'Usuario no válido.']);
        }

        $carro = $this->getOrCreateCarro($em, $session, $usuario);
        $producto = $em->getRepository(Producto::class)->find($codProd);
        if (!$producto) {
            return new JsonResponse(['exito' => false, 'error' => 'Producto no encontrado.']);
        }

        $carroProductoRepo = $em->getRepository(CarroProducto::class);
        $carroProducto = $carroProductoRepo->findOneBy([
            'carro' => $carro,
            'producto' => $producto,
        ]);

        $nuevaCantidad = $cart[$codProd] - 1;
        if ($nuevaCantidad <= 0) {
            unset($cart[$codProd]);
            if ($carroProducto) {
                $em->remove($carroProducto);
            }
        } else {
            $cart[$codProd] = $nuevaCantidad;
            if ($carroProducto) {
                $carroProducto->setUnidades($nuevaCantidad);
            }
        }

        $this->setCart($session, $cart);
        $nuevoTotal = $this->actualizarTotalCarro($em, $carro, $cart);
        $em->flush();

        return new JsonResponse([
            'exito' => true,
            'nuevoTotal' => $nuevoTotal,
            'cantidadProductos' => count($cart),
        ]);
    }

    #[Route('/api/carro/eliminar', name: 'api_carro_eliminar', methods: ['POST'])]
    public function eliminarCarro(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $session = $request->getSession();
        $usuarioSesion = $session->get('usuario');

        if (!$usuarioSesion || !isset($usuarioSesion['gmail'])) {
            return new JsonResponse(['exito' => false, 'error' => 'Sesión no válida.']);
        }

        $codProd = (int)$request->request->get('id', 0);
        if ($codProd < 1) {
            return new JsonResponse(['exito' => false, 'error' => 'Faltan datos.']);
        }

        $cart = $this->getCart($session);
        if (!isset($cart[$codProd])) {
            return new JsonResponse(['exito' => false, 'error' => 'Producto no encontrado en el carrito.']);
        }

        $usuario = $em->getRepository(Usuario::class)->findOneBy([
            'gmail' => $usuarioSesion['gmail'],
        ]);
        if (!$usuario) {
            return new JsonResponse(['exito' => false, 'error' => 'Usuario no válido.']);
        }

        $carro = $this->getOrCreateCarro($em, $session, $usuario);
        $producto = $em->getRepository(Producto::class)->find($codProd);
        if ($producto) {
            $carroProducto = $em->getRepository(CarroProducto::class)->findOneBy([
                'carro' => $carro,
                'producto' => $producto,
            ]);
            if ($carroProducto) {
                $em->remove($carroProducto);
            }
        }

        unset($cart[$codProd]);
        $this->setCart($session, $cart);

        $nuevoTotal = $this->actualizarTotalCarro($em, $carro, $cart);
        $em->flush();

        return new JsonResponse([
            'exito' => true,
            'nuevoTotal' => $nuevoTotal,
            'cantidadProductos' => count($cart),
        ]);
    }

    #[Route('/api/pedido/finalizar', name: 'api_pedido_finalizar', methods: ['POST'])]
    public function finalizarPedido(Request $request, EntityManagerInterface $em): JsonResponse
    {
        try {
            $session = $request->getSession();
            $usuarioSesion = $session->get('usuario');

            if (!$usuarioSesion || !isset($usuarioSesion['gmail'])) {
                return new JsonResponse(['exito' => false, 'error' => 'Sesión no válida.']);
            }

            $cart = $this->getCart($session);
            if (empty($cart)) {
                return new JsonResponse(['exito' => false, 'error' => 'Carrito vacío.']);
            }

            $usuario = $em->getRepository(Usuario::class)->findOneBy([
                'gmail' => $usuarioSesion['gmail'],
            ]);
            if (!$usuario) {
                return new JsonResponse(['exito' => false, 'error' => 'Usuario no válido.']);
            }

            $carro = $this->getOrCreateCarro($em, $session, $usuario);
            $carro->setEnviado(true);

            foreach ($cart as $codProd => $unidades) {
                $producto = $em->getRepository(Producto::class)->find((int)$codProd);
                if (!$producto) {
                    continue;
                }

                $nuevoStock = (int)$producto->getStock() - (int)$unidades;
                if ($nuevoStock < 0) {
                    return new JsonResponse([
                        'exito' => false,
                        'error' => 'No hay suficiente stock para completar el pedido.',
                    ]);
                }

                $producto->setStock($nuevoStock);
            }

            $nuevoCarro = new Carro();
            $nuevoCarro->setUsuarioGmail($usuario->getGmail());
            $nuevoCarro->setFecha(new \DateTime());
            $nuevoCarro->setTotal('0.00');
            $nuevoCarro->setEnviado(false);
            $em->persist($nuevoCarro);

            $em->flush();

            $session->set('CodCarro', $nuevoCarro->getId());
            $session->set('carrito', []);

            return new JsonResponse([
                'exito' => true,
                'mensaje' => 'Pedido completado exitosamente y stock actualizado.',
                'newCodCarro' => $nuevoCarro->getId(),
            ]);
        } catch (\Exception $e) {
            return new JsonResponse([
                'exito' => false,
                'error' => 'Error al finalizar pedido: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function getCart(SessionInterface $session): array
    {
        $cart = $session->get('carrito', []);
        return is_array($cart) ? $cart : [];
    }

    private function setCart(SessionInterface $session, array $cart): void
    {
        $session->set('carrito', $cart);
    }

    //funcion para obtener el carro de la base de datos a partir del CodCarro guardado en la sesión, si no existe lanza una excepción
    private function getCarroFromSession(EntityManagerInterface $em, SessionInterface $session): Carro
    {
        $codCarro = (int)$session->get('CodCarro', 0);
        $carro = $codCarro ? $em->getRepository(Carro::class)->find($codCarro) : null;

        if (!$carro) {
            throw new \RuntimeException('Carrito no válido.');
        }

        return $carro;
    }

    //funcion para obtener o crear el carro de la base de datos a partir del CodCarro guardado en la sesión, si no existe lo crea y lo guarda en la sesión
    private function getOrCreateCarro(EntityManagerInterface $em, SessionInterface $session, Usuario $usuario): Carro
    {
        $codCarro = (int)$session->get('CodCarro', 0);
        if ($codCarro) {
            $carro = $em->getRepository(Carro::class)->find($codCarro);
            if ($carro) {
                return $carro;
            }
        }

        $carro = $em->getRepository(Carro::class)->findOneBy([
            'usuarioGmail' => $usuario->getGmail(),
            'enviado' => false,
        ]);

        if (!$carro) {
            $carro = new Carro();
            $carro->setUsuarioGmail($usuario->getGmail());
            $carro->setFecha(new \DateTime());
            $carro->setTotal('0.00');
            $carro->setEnviado(false);
            $em->persist($carro);
            $em->flush();
        }

        $session->set('CodCarro', $carro->getId());
        if (!$session->has('carrito')) {
            $session->set('carrito', $this->buildCartFromDb($em, $carro));
        }

        return $carro;
    }

    //funcion para construir el carrito a partir de los datos de la base de datos, devuelve un array con el formato [codProd => unidades]
    private function buildCartFromDb(EntityManagerInterface $em, Carro $carro): array
    {
        $cart = [];
        $items = $em->getRepository(CarroProducto::class)->findBy(['carro' => $carro]);
        foreach ($items as $item) {
            $cart[$item->getProducto()->getId()] = $item->getUnidades();
        }
        return $cart;
    }

    //funcion para actualizar el total del carro a partir de los datos del carrito, devuelve el nuevo total
    private function actualizarTotalCarro(EntityManagerInterface $em, Carro $carro, array $cart): float
    {
        $total = 0.00;
        foreach ($cart as $codProd => $unidades) {
            $producto = $em->getRepository(Producto::class)->find((int)$codProd);
            if ($producto) {
                $total += (float)$producto->getPrecio() * (int)$unidades;
            }
        }

        $total = round($total, 2);
        $carro->setTotal(number_format($total, 2, '.', ''));

        return $total;
    }
}
