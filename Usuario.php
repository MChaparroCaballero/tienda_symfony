<?php
// src/Entity/Usuario.php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'usuarios')]
class Usuario
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer', name: 'ID')]
    private $id;

    #[ORM\Column(type: 'string', length: 100, name: 'NOMBRE')]
    private $nombre;

    #[ORM\Column(type: 'string', length: 200, name: 'GMAIL', unique: true)]
    private $gmail;

    #[ORM\Column(type: 'string', length: 200, name: 'CLAVE')]
    private $clave;

    #[ORM\Column(type: 'integer', name: 'rol', nullable: true)]
    private $rol = 0;

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

    public function getGmail()
    {
        return $this->gmail;
    }

    public function setGmail($gmail)
    {
        $this->gmail = $gmail;
    }

    public function getClave()
    {
        return $this->clave;
    }

    public function setClave($clave)
    {
        $this->clave = $clave;
    }

    public function getRol()
    {
        return $this->rol;
    }

    public function setRol($rol)
    {
        $this->rol = $rol;
    }

    
}
