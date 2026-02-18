<?php
// src/Entity/CarroProducto.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'carroproductos')]
class CarroProducto
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer', name: 'CodCarroProd')]
    private $id;

    #[ORM\ManyToOne(targetEntity: Carro::class, inversedBy: 'carroProductos')]
    #[ORM\JoinColumn(name: 'CodCarro', referencedColumnName: 'CodCarro', nullable: false)]
    private $carro;

    #[ORM\ManyToOne(targetEntity: Producto::class, inversedBy: 'carroProductos')]
    #[ORM\JoinColumn(name: 'CodProd', referencedColumnName: 'CodProd', nullable: false)]
    private $producto;

    #[ORM\Column(type: 'integer', name: 'Unidades')]
    private $unidades = 1;

    public function getId()
    {
        return $this->id;
    }

    public function getCarro(): ?Carro
    {
        return $this->carro;
    }

    public function setCarro(Carro $carro)
    {
        $this->carro = $carro;
    }

    public function getProducto(): ?Producto
    {
        return $this->producto;
    }

    public function setProducto(Producto $producto)
    {
        $this->producto = $producto;
    }

    public function getUnidades()
    {
        return $this->unidades;
    }

    public function setUnidades($unidades)
    {
        $this->unidades = $unidades;
    }
}
