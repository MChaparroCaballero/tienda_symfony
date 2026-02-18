<?php
// src/Entity/Categoria.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
#[ORM\Table(name: 'categoria')]
class Categoria
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer', name: 'CodCat')]
    private $id;

    #[ORM\Column(type: 'string', length: 45, name: 'Nombre')]
    private $nombre;

    #[ORM\Column(type: 'string', length: 200, name: 'Descripcion')]
    private $descripcion;

    #[ORM\OneToMany(mappedBy: 'categoria', targetEntity: Producto::class)]
    private $productos;

    public function __construct()
    {
        $this->productos = new ArrayCollection();
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

    public function getProductos(): Collection
    {
        return $this->productos;
    }
}
