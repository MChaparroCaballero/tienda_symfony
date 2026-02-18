<?php
//osea son dos pare que sean desacopladas y de spa una te pilla el index padre y te lo carha directamente y el otro los elementos//

// src/Controller/TiendaController.php
namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class TiendaController extends AbstractController
{
    #[Route('/', name: 'tienda_home')]
    #[Route('/tienda', name: 'tienda_home_alt')]
    public function index(): Response
    {
        return $this->render('tienda/index.html.twig');
    }
}
