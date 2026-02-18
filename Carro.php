<?php
// src/Entity/Carro.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity]
#[ORM\Table(name: 'carro')]
class Carro
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer', name: 'CodCarro')]
    private $id;

    #[ORM\Column(type: 'string', length: 100, name: 'Usuario')]
    private $usuarioGmail;

    #[ORM\Column(type: 'datetime', name: 'Fecha')]
    private $fecha;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 2, name: 'Total')]
    private $total;

    #[ORM\Column(type: 'boolean', name: 'Enviado')]
    private $enviado = false;

    #[ORM\OneToMany(mappedBy: 'carro', targetEntity: CarroProducto::class, orphanRemoval: true)]
    private $carroProductos;

    public function __construct()
    {
        $this->carroProductos = new ArrayCollection();
    }

    public function getId()
    {
        return $this->id;
    }

    public function getUsuarioGmail(): ?string
    {
        return $this->usuarioGmail;
    }

    public function setUsuarioGmail(string $usuarioGmail)
    {
        $this->usuarioGmail = $usuarioGmail;
    }

    public function getFecha(): ?\DateTimeInterface
    {
        return $this->fecha;
    }

    public function setFecha(\DateTimeInterface $fecha)
    {
        $this->fecha = $fecha;
    }

    public function getTotal()
    {
        return $this->total;
    }

    public function setTotal($total)
    {
        $this->total = $total;
    }

    public function isEnviado(): bool
    {
        return (bool)$this->enviado;
    }

    public function setEnviado($enviado)
    {
        $this->enviado = (bool)$enviado;
    }

    public function getCarroProductos(): Collection
    {
        return $this->carroProductos;
    }
}
