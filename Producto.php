<?php
// src/Entity/Producto.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
#[ORM\Table(name: 'productos')]
class Producto
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer', name: 'CodProd')]
    private $id;

    #[ORM\Column(type: 'string', length: 45, name: 'Nombre', nullable: true)]
    private $nombre;

    #[ORM\Column(type: 'string', length: 90, name: 'Descripcion')]
    private $descripcion;

    #[ORM\Column(type: 'integer', name: 'stock')]
    private $stock;

    #[ORM\ManyToOne(targetEntity: Categoria::class, inversedBy: 'productos')]
    #[ORM\JoinColumn(name: 'CodCat', referencedColumnName: 'CodCat', nullable: false)]
    private $categoria;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, name: 'Precio')]
    private $precio;

    #[ORM\Column(type: 'string', length: 50, name: 'estado')]
    private $estado;

    #[ORM\OneToMany(mappedBy: 'producto', targetEntity: CarroProducto::class)]
    private $carroProductos;

    public function __construct()
    {
        $this->carroProductos = new ArrayCollection();
    }

    public function getId()
    {
        return $this->id;
    }

    public function getNombre()
    {
        return $this->nombre;
    }

    public function setNombre($nombre)
    {
        $this->nombre = $nombre;
    }

    public function getDescripcion()
    {
        return $this->descripcion;
    }

    public function setDescripcion($descripcion)
    {
        $this->descripcion = $descripcion;
    }

    public function getStock()
    {
        return $this->stock;
    }

    public function setStock($stock)
    {
        $this->stock = $stock;
    }

    public function getCategoria(): ?Categoria
    {
        return $this->categoria;
    }

    public function setCategoria(Categoria $categoria)
    {
        $this->categoria = $categoria;
    }

    public function getPrecio()
    {
        return $this->precio;
    }

    public function setPrecio($precio)
    {
        $this->precio = $precio;
    }

    public function getEstado()
    {
        return $this->estado;
    }

    public function setEstado($estado)
    {
        $this->estado = $estado;
    }

    public function getCarroProductos(): Collection
    {
        return $this->carroProductos;
    }
}
