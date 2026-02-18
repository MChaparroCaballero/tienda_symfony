const apiBase = document.body.dataset.apiBase || '/api';
const assetBase = document.body.dataset.assetBase || '/assets/tienda';

/**Función para realizar el login del usuario. Envía las credenciales al servidor y maneja la respuesta*/
function login(){
    //valores del formulario y preparacion para envio
    var usuario = document.getElementById("usuario").value;
    var contrasena = document.getElementById("contrasena").value;
    
    var datos = "usuario=" + usuario + "&clave=" + contrasena;
    
    //petición AJAX
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        // Cuando la petición se completa exitosamente primero comrpobamos que el login fue correcto 
        if (this.readyState == 4 && this.status == 200) {
            try {
                // Verificar que la respuesta no esté vacía
                if (!this.responseText || this.responseText.trim() === '') {
                    mostrarAlertaError("Error: Respuesta vacía del servidor");
                    console.error("Respuesta vacía del servidor");
                    return;
                }
                
                var respuesta = JSON.parse(this.responseText);
            
            // Si el login fue exitoso primero de todo preparamos la interfaz eliminando algun posible mensaje de error previo//
            if (respuesta.login) {
                var alertError = document.getElementById("alertError");
                if (alertError) {
                    alertError.remove();
                }
                
                // Guardo los datos en sessionStorage esto es más para mi que para el usuario
                sessionStorage.setItem('usuario', respuesta.nombre);
                sessionStorage.setItem('logueado', 'true');
                if (respuesta.num_productos !== undefined) {
                    sessionStorage.setItem('num_productos', respuesta.num_productos);
                }
                
                // si el login va bien se oculta el formulario de login y todos sus elementos relacionados (inputs, botón) y se muestra el nombre del usuario, el botón de cerrar sesión y el de la cesta
                var formulario = document.getElementById("formularioLogin");
                formulario.classList.add("d-none");
                
                var botonIniciar = document.getElementById("btnIniciarSesion");
                botonIniciar.classList.add("d-none");
                
                var botonCerrar = document.getElementById("btnCerrarSesion");
                botonCerrar.classList.remove("d-none");
                botonCerrar.style.display = "inline";

                var botonCesta = document.getElementById("botonCesta");
                botonCesta.classList.remove("d-none");
                botonCesta.style.display = "inline";
                
                var apodo = document.getElementById("datosUsuario");
                apodo.classList.remove("d-none");
                apodo.style.display = "inline";
                apodo.innerHTML = "Bienvenido " + respuesta.nombre;
                
                // Si hay productos en la cesta, mostramos la cesta automáticamente siempre que sean mayor que 0 productos, porque si es 0 no tiene sentido mostrarla
                if (respuesta.num_productos && respuesta.num_productos > 0) {
                    mostrarCesta();
                }
            } else {
                // Si el login falló (usuario/contraseña incorrectos) se muestra el error rojo con un alert que lo creamos directamente aqui
                var alertError = document.getElementById("alertError");
                if (!alertError) {
                    alertError = document.createElement("div");
                    alertError.id = "alertError";
                    alertError.className = "alert alert-danger alert-dismissible fade show m-0 ms-3";
                    alertError.style.padding = "0.5rem 1rem";
                    alertError.innerHTML = `
                        <strong>Error:</strong> ${respuesta.mensaje}
                        <button type="button" class="btn-close" style="padding: 0.25rem;" onclick="this.parentElement.remove()"></button>
                    `;
                    document.getElementById("contenedorLogin").appendChild(alertError);
                } else {
                    // Actualizar el mensaje si ya existe
                    alertError.innerHTML = `
                        <strong>Error:</strong> ${respuesta.mensaje}
                        <button type="button" class="btn-close" style="padding: 0.25rem;" onclick="this.parentElement.remove()"></button>
                    `;
                }
            }
            } catch (e) {
                mostrarAlertaError("Error al procesar la respuesta del servidor: " + e.message);
                console.error("Error JSON:", this.responseText);
            }
        } else if (this.readyState == 4 && this.status !== 200) {
            mostrarAlertaError("Error del servidor: " + this.status);
        }
    }
    
    // Enviamos la petición POST al servidor
    xhttp.open("POST", `${apiBase}/login`, true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(datos);
    };

/**Función para cerrar la sesión del usuario,limpia los datos de sesión del servidor y del navegador*/
function cerrarSesion() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        //primero comprobamos que la peticion ha tenido exito y despues que el servidor ha respondido , parseamos la respuesta
        if (this.readyState == 4 && this.status == 200) {
            var respuesta = JSON.parse(this.responseText);
            
            //si todo va bien, se limpia los datos locales de sesión y volvemos a mostrar el formulario del login y ocultar lo de cerrar sesion,el usuario y cesta mediante la clase de bootstrap de d-none
            if (respuesta.status === "ok") {
                sessionStorage.clear();
    
                var formulario = document.getElementById("formularioLogin");
                formulario.classList.remove("d-none");
                
                var botonIniciar = document.getElementById("btnIniciarSesion");
                botonIniciar.classList.remove("d-none");
                
                document.getElementById("datosUsuario").classList.add("d-none");
                
                document.getElementById("btnCerrarSesion").classList.add("d-none");

                document.getElementById("botonCesta").classList.add("d-none");

                // Limpiar los campos del formulario
                document.getElementById("usuario").value = "";
                document.getElementById("contrasena").value = "";
                location.reload();
                
            }
        }
    };
    // Llamar al archivo logout.php para destruir la sesión en el servidor
    xhttp.open("GET", `${apiBase}/logout`, true);
    xhttp.send();
}

/*Función para cargar las categorías disponibles desde el servidor, lo que son las pestañas y los enlaces para filtrar productos*/
function cargarCategorias(){
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            // Parseamos la respuesta JSON con las categorías y creamos las pestañas dinámicamente con elementos li
            var categorias = JSON.parse(this.responseText);
            var contenedor = document.getElementById("contenedorCategorias");
            contenedor.innerHTML = "";

            categorias.forEach(cat => {
                var li = document.createElement("li");
                li.className = "nav-item";
                
                // el evento onclick para cargar productos
                li.innerHTML = `<a class="nav-link" href="#" onclick="cargarProductos(this, ${cat.CodCat})">${cat.Nombre}</a>`;
                
                contenedor.appendChild(li);
            });
        }
    };
    // Solicitar las categorías al servidor
    xhttp.open("GET", `${apiBase}/categorias`, true);
    xhttp.send();
}
/*función para cargar los productos de una categoría específica. Se llama al hacer click en una pestaña de categoría y actualiza el contenido del contenedor de productos*/
function cargarProductos(elemento, id){
    // Resaltar la pestaña activa quitando la clase 'active' de todas las demás
    var links = document.querySelectorAll('.nav-link');
    links.forEach(l => l.classList.remove('active'));
    elemento.classList.add('active');

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            
            try {
                // Parseamos la respuesta JSON con los productos y creamos las tarjetas dinámicamente y segun el stock y precio se muestra de una forma u otra, si el stock es 0 se muestra un mensaje de agotado y el botón de añadir se deshabilita, si el precio es 0 se muestra como "Gratis"
                var productos = JSON.parse(this.responseText);
                var contenedor = document.getElementById("contenedorProductos");
                contenedor.innerHTML = "";

                // Verificar si hay error en la respuesta
                if (productos.error) {
                    contenedor.innerHTML = "<p class='text-center w-100 text-danger'>Error: " + productos.error + "</p>";
                    return;
                }

                // Verificar si no hay productos
                if (productos.length === 0) {
                    contenedor.innerHTML = "<p class='text-center w-100'>No hay productos disponibles.</p>";
                    return;
                }

                // Crear una tarjeta (card) para cada producto
                productos.forEach(p => {
                    var precioFormato = parseFloat(p.Precio).toFixed(2);
                    var rutaImagen = `${assetBase}/img/${p.CodProd}.png`;
                    contenedor.innerHTML += `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100 shadow-sm d-flex flex-column">
                            <img src="${rutaImagen}" class="card-img-top" alt="${p.Nombre}" 
                                     style="height: 200px; object-fit: contain; padding: 10px;">
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title">${p.Nombre}</h5>
                                    <p class="card-text text-muted small">${p.Descripcion}</p>
                                    <hr>
                                    <div class="mb-3">
                                        <span class="badge bg-secondary">Stock: ${p.Stock}</span>
                                        <span class="badge bg-primary ms-2">Precio: ${precioFormato}€</span>
                                    </div>
                                    <div class="mt-auto text-center">
                                        <button class="btn btn-sm btn-success w-100" onclick="abrirModal('${p.CodProd}', '${p.Nombre}', '${p.Descripcion}', ${p.Stock}, ${p.Precio})">Añadir</button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });
            } catch (e) {
                console.error("Error al procesar los productos:", e);
            }
        }
    };
    // Solicitar los productos de la categoría seleccionada
    xhttp.open("GET", `${apiBase}/productos?catID=${id}`, true);
    xhttp.send();
}

/**Función para verificar si hay una sesión activa en el servidor Se ejecuta al cargar la página para mantener al usuario logueado después de refrescar*/
function verificarSesion() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var respuesta = JSON.parse(this.responseText);
            console.log("Estado de sesión:", respuesta);
            
            // Si hay una sesión activa en el servidor
            if (respuesta.logueado) {
                // Guardar datos en sessionStorage
                sessionStorage.setItem('usuario', respuesta.nombre);
                sessionStorage.setItem('email', respuesta.email);
                sessionStorage.setItem('logueado', 'true');
                if (respuesta.num_productos !== undefined) {
                    sessionStorage.setItem('num_productos', respuesta.num_productos);
                }
                if (respuesta.codCarro !== undefined) {
                    sessionStorage.setItem('codCarro', respuesta.codCarro);
                }
                
                // preparamos la interfaz para el usuario logueado ocultando el formulario de login y mostrando su nombre, el botón de cerrar sesión y el de la cesta, además de mostrar la cesta automáticamente si hay productos en ella
                var formulario = document.getElementById("formularioLogin");
                formulario.classList.add("d-none");
                
                var botonIniciar = document.getElementById("btnIniciarSesion");
                botonIniciar.classList.add("d-none");
                
                var apodo = document.getElementById("datosUsuario");
                apodo.classList.remove("d-none");
                apodo.style.display = "inline";
                apodo.innerHTML = "Bienvenido " + respuesta.nombre;
                
                var botonCerrar = document.getElementById("btnCerrarSesion");
                botonCerrar.classList.remove("d-none");
                botonCerrar.style.display = "inline";

                var botonCesta = document.getElementById("botonCesta");
                botonCesta.classList.remove("d-none");
                botonCesta.style.display = "inline";
                
                // Si hay productos en la cesta, mostrarla automáticamente
                if (respuesta.num_productos && respuesta.num_productos > 0) {
                    mostrarCesta();
                }
            }
        }
    };
    // Consultar al servidor si hay una sesión activa
    xhttp.open("GET", `${apiBase}/sesion`, true);
    xhttp.send();
}


window.onload = function() {
   cargarCategorias();         // Cargar las pestañas de categorías
    verificarSesion();            // Verificar si hay sesión activa (clave para mantener login)
    cargarProductosPorDefecto(1); // Muestra productos de la primera categoría
};

//Similar a cargarProductos, pero se ejecuta automáticamente sin click del usuario, es para cargar un predefinido//
function cargarProductosPorDefecto(idCategoria) {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            try {
                // Parseamos la respuesta JSON con los productos y creamos las tarjetas dinámicamente y segun el stock y precio se muestra de una forma u otra, si el stock es 0 se muestra un mensaje de agotado y el botón de añadir se deshabilita, si el precio es 0 se muestra como "Gratis"
                var productos = JSON.parse(this.responseText);
                var contenedor = document.getElementById("contenedorProductos");
                contenedor.innerHTML = "";

                // Verificar si hay error en la respuesta
                if (productos.error) {
                    contenedor.innerHTML = "<p class='text-center w-100 text-danger'>Error: " + productos.error + "</p>";
                    return;
                }

                // Verificar si no hay productos
                if (productos.length === 0) {
                    contenedor.innerHTML = "<p class='text-center w-100'>No hay productos disponibles.</p>";
                    return;
                }

                // Crear una tarjeta para cada producto
                productos.forEach(p => {
                    var precioFormato = parseFloat(p.Precio).toFixed(2);
                    var rutaImagen = `${assetBase}/img/${p.CodProd}.png`;
                    contenedor.innerHTML += `
                        <div class="col-md-4 mb-4">
                            <div class="card h-100 shadow-sm d-flex flex-column">
                            <img src="${rutaImagen}" class="card-img-top" alt="${p.Nombre}" 
                                     style="height: 200px; object-fit: contain; padding: 10px;">
                                <div class="card-body d-flex flex-column">
                                    <h5 class="card-title">${p.Nombre}</h5>
                                    <p class="card-text text-muted small">${p.Descripcion}</p>
                                    <hr>
                                    <div class="mb-3">
                                        <span class="badge bg-secondary">Stock: ${p.Stock}</span>
                                        <span class="badge bg-primary ms-2">Precio: ${precioFormato}€</span>
                                    </div>
                                    <div class="mt-auto text-center">
                                        <button class="btn btn-sm btn-success w-100" onclick="abrirModal('${p.CodProd}', '${p.Nombre}', '${p.Descripcion}', ${p.Stock}, ${p.Precio})">Añadir</button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });
                
                // Marca la primera categoría como activa después de un pequeño delay
                // (para asegurar que las categorías ya se han cargado)
                setTimeout(() => {
                    var primerLink = document.querySelector('.nav-link');
                    if (primerLink) {
                        primerLink.classList.add('active');
                    }
                }, 100);
            } catch (e) {
                console.error("Error al procesar los productos:", e);
            }
        }
    };
    xhttp.open("GET", `${apiBase}/productos?catID=${idCategoria}`, true);
    xhttp.send();
}

/*Función para mostrar el contenido de la cesta de compra. Realiza una petición al servidor para obtener los productos en la cesta y los muestra en un formato amigable, permitiendo modificar cantidades o eliminar productos*/
function mostrarCesta(){
    var tarjetaPrincipal = document.getElementById("contenedorCesta");
    var cuerpoCesta = document.getElementById("contenedorCestaBody");

    // Limpiar contenedor anterior y preparar para mostrar la cesta, quitamos el d-none por si acaso y mostramos un mensaje de cargando mientras llega la respuesta del servidor
    cuerpoCesta.innerHTML = '';

    tarjetaPrincipal.classList.remove("d-none");
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            try {
                var respuesta = JSON.parse(this.responseText);

                // Verificar si hay productos en la cesta y mostrarlos, si no hay productos se muestra un mensaje indicando que la cesta está vacía
                if (respuesta.productos && respuesta.productos.length > 0) {
                    
                    // Crear contenedor para productos
                    var htmlProductos = '<div class="cesta-productos">';
                    
                    respuesta.productos.forEach(p => {
                        var precioPorUnidad = parseFloat(p.precio).toFixed(2);
                        var precioTotal = parseFloat(p.precio_total).toFixed(2);
                        var unidades = p.unidades_compra;
                        var codProd = p.CodProd;
                        
                        // creamos card por producto en la cesta
                        htmlProductos += `
                            <div class="card mb-3" style="border-left: 4px solid #007bff;">
                                <div class="card-body p-3">
                                    <div class="row align-items-center">
                                        <div class="col-md-4">
                                            <h6 class="card-title mb-1">${p.Nombre}</h6>
                                            <small class="text-muted">(Código: ${codProd})</small>
                                        </div>
                                        
                                        <div class="col-auto ms-auto">
                                            <div class="d-flex align-items-center gap-3">
                                       
                                                <div class="d-flex align-items-center gap-2">
                                                    <button class="btn btn-sm btn-outline-danger" onclick="decrementarCarrito(${codProd})">−</button>
                                                    <input type="number" class="form-control form-control-sm text-center" value="${unidades}" min="1" style="width: 60px;" readonly>
                                                    <button class="btn btn-sm btn-outline-success" onclick="incrementarCarrito(${codProd})">+</button>
                                                </div>
                                            
                                         
                                            <button class="btn btn-sm btn-danger w-100 d-flex justify-content-center align-items-center" onclick="eliminarProductoCarrito(${codProd})">
                                                <img src="${assetBase}/img/iconos/papelera.png" alt="Eliminar" style="width: 20px; height: 20px;">
                                            </button>
                                            </div>
                                        </div>
                                        <div class="col">
                                            <div class="d-flex justify-content-start align-items-center gap-4">
                                                <div class="text-start">
                                                    <small class="text-muted d-block">Unitario</small>
                                                    <strong>$${precioPorUnidad}</strong>
                                                </div>
                                            
                                            
                                            
                                                <div class="text-start">
                                                    <small class="text-muted d-block">Subtotal</small>
                                                    <strong class="text-success">$${precioTotal}</strong>
                                                </div>
                                            </div>
                                        </div>
                                        
                                       
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    htmlProductos += '</div>';
                    cuerpoCesta.insertAdjacentHTML('beforeend', htmlProductos);

                    // Mostrar total del carrito
                    var totalCarrito = parseFloat(respuesta.total).toFixed(2);
                    var htmlTotal = `
                        <div class="card mt-4" style="background-color: #f8f9fa; border: 2px solid #28a745;">
                            <div class="card-body p-3">
                                <div class="row align-items-center">
                                    <div class="col">
                                        <h5 class="mb-0" style="font-weight: bold;">TOTAL DEL CARRITO</h5>
                                    </div>
                                    <div class="col-auto">
                                        <h4 class="text-success text-end mb-0 text-nowrap">$${totalCarrito}</h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    cuerpoCesta.insertAdjacentHTML('beforeend', htmlTotal);

                    // Botón para procesar pedido
                    cuerpoCesta.insertAdjacentHTML('beforeend', '<button class="btn btn-success w-100 mt-3" style="padding: 12px; font-size: 1.1rem;" onclick="mostrarModalConfirmacion()">✓ Comprar Pedido</button>');

                } else {
                    cuerpoCesta.insertAdjacentHTML('beforeend', "<p class='text-muted text-center' style='padding: 30px;'>Tu cesta está vacía.</p>");
                }

            } catch (e) {
                console.error("Error JS:", e);
            }
        }
    };

    xhttp.open("GET", `${apiBase}/carro`, true);
    xhttp.send();
}

// Función para incrementar unidades en el carrito
function incrementarCarrito(codProd) {
    var formData = new FormData();
    formData.append('id', codProd);
    formData.append('cantidad', 1);
    
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            try {
                // Parseamos la respuesta y recargamos la cesta para mostrar los cambios si va bien sino mostramos un error con la función personalizada de alertas
                var respuesta = JSON.parse(this.responseText);
                if (respuesta.exito) {
                    mostrarCesta(); // Recargar la cesta
                } else {
                    mostrarAlertaError(respuesta.error);
                }
            } catch (e) {
                console.error("Error JS:", e);
            }
        }
    };
    
    xhttp.open("POST", `${apiBase}/carro/anadir`, true);
    xhttp.send(formData);
}

// Función para decrementar unidades en el carrito y que nos recarge la cesta o nso muestre un mensaje de error
function decrementarCarrito(codProd) {
    var formData = new FormData();
    formData.append('id', codProd);
    
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            try {
                var respuesta = JSON.parse(this.responseText);
                if (respuesta.exito) {
                    mostrarCesta(); // Recargar la cesta
                } else {
                    mostrarAlertaError(respuesta.error);
                }
            } catch (e) {
                console.error("Error JS:", e);
            }
        }
    };
    
    xhttp.open("POST", `${apiBase}/carro/decrementar`, true);
    xhttp.send(formData);
}

// Función para eliminar un producto del carrito, esta es cuando ya llegag a 0 cuando decrementas en el carrito o le das directamente a eliminar, primero se muestra un mensaje de confirmación para evitar eliminaciones accidentales, si el usuario confirma se envía la petición al servidor y se recarga la cesta para mostrar los cambios o un mensaje de error si algo va mal
function eliminarProductoCarrito(codProd) {
    //preguntamos si esta seguro adjuntando a la peticion este mini formulario de aceptar o cancelar//
        var formData = new FormData();
        formData.append('id', codProd);
        
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                try {
                    var respuesta = JSON.parse(this.responseText);
                    if (respuesta.exito) {
                        mostrarCesta(); // Recargar la cesta
                    } else {
                        mostrarAlertaError(respuesta.error);
                    }
                } catch (e) {
                    console.error("Error JS:", e);
                }
            }
        };
        
        xhttp.open("POST", `${apiBase}/carro/eliminar`, true);
        xhttp.send(formData);
    
}


// Variables globales para saber qué estamos comprando
let productoActualID = null;
let stockActual = 0;
let precioUnitarioActual = 0;

// funcion para abrir EL MODAL de cuando le das a comprar un producto, esta función recibe los datos del producto para mostrarlos en el modal y preparar la compra, también se encarga de actualizar el precio total según la cantidad que se quiera comprar y de mostrar el modal
function abrirModal(id, nombre, descripcion, stock, precio) {
    // Guardamos los datos en variables globales para usarlos luego
    productoActualID = id;
    stockActual = parseInt(stock);
    precioUnitarioActual = parseFloat(precio);

    // Rellenamos el HTML del modal con los datos del producto
    document.getElementById("modalTitulo").innerText = nombre;
    document.getElementById("modalDescripcion").innerText = descripcion;
    document.getElementById("modalPrecio").innerText = "Precio unitario: " + precioUnitarioActual.toFixed(2) + "€";
    document.getElementById("modalCantidad").max = stock; // Establecemos el máximo según el stock disponible
    document.getElementById("modalCantidad").min = 1; // Mínimo 1
    document.getElementById("modalImagen").src= `./assets/tienda/img/${id}.png`; // Asumimos que la imagen se llama igual que el ID del producto
    // Reseteamos la cantidad a 1 siempre que abrimos
   var cantidad= document.getElementById("modalCantidad");
   cantidad.value = 1;

    // Agregamos event listener para actualizar precio cuando cambie la cantidad
    cantidad.removeEventListener('input', actualizarPrecioTotal);
    cantidad.addEventListener('input', actualizarPrecioTotal);

   // Inicializamos el precio total
    var precioTotal = document.getElementById("modalPrecio");
    precioTotal.innerText = precioUnitarioActual.toFixed(2);


    // Mostramos el modal quitando la clase d-none
    document.getElementById("modalOverlay").classList.remove("d-none");
}

//esta funcion es totalmente visual, es para que cuando se incremente o decremente un producto se pueda ver visualmente en la pantalla
function actualizarPrecioTotal() {
    var inputCantidad = document.getElementById("modalCantidad");
    var cantidad = parseInt(inputCantidad.value) || 0; 
    
    // Multiplicamos el precio guardado por la cantidad actual
    var precioTotal = precioUnitarioActual * cantidad;
    
    // Actualizamos el texto
    document.getElementById("modalPrecio").innerText = precioTotal.toFixed(2);
}

//funcion para CERRAR EL MODAL
function cerrarModal() {
    document.getElementById("modalOverlay").classList.add("d-none");
    productoActualID = null; // Limpiamos variable
}

//esta funcion es totalmente visual, es para que cuando se incremente o decremente un producto se pueda ver visualmente en la pantalla EN CNATIDAD Y PRECIO, cuando aun no esta en la cesta
function ajustarCantidad(cambio) {
    let input = document.getElementById("modalCantidad");
    let valorActual = parseInt(input.value) || 0;
    let nuevoValor = valorActual + cambio;

    // Validaciones: No bajar de 1 y no superar el stock
    if (nuevoValor >= 1 && nuevoValor <= stockActual) {
        input.value = nuevoValor;
        let precioTotal = precioUnitarioActual * nuevoValor;
         // Actualizamos el texto
        document.getElementById("modalPrecio").innerText = precioTotal.toFixed(2);
        
    } else if (nuevoValor > stockActual) {
        alert("¡No hay suficiente stock! Máximo: " + stockActual);
    }
}


// funcion para confirmar que el usuario esta loggueado antes de que agregemos un producto al carro
function confirmarAgregarAlCarro() {
    let estaLogueado = sessionStorage.getItem('logueado');

    // Verificamos si el usuario está logueado para que sino se cierre el modal y no se envie nada al servidor
    if (estaLogueado !== 'true') {
        mostrarAlertaError("Debes iniciar sesión para poder comprar.");
        cerrarModal(); // Cerramos el modal
        
        document.getElementById("usuario").focus(); 
        return; // Esto detiene la función aquí. No se envía nada al servidor.
    }
    //pero si está logueado, seguimos con el proceso normal
    let cantidad = document.getElementById("modalCantidad").value;
    
   // Preparamos los datos para enviar
    let datos = new FormData();
    datos.append("id", productoActualID);
    datos.append("cantidad", cantidad);

    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            try {
                var respuesta = JSON.parse(this.responseText);
                
                if (respuesta.exito) {
                    cerrarModal();
                    
                    // Actualizamos la cesta visualmente.
                    mostrarCesta(); 

                } else {
                    mostrarAlertaError(respuesta.error);
                }
            } catch (e) {
                mostrarAlertaError(this.responseText || "Error desconocido al agregar al carrito");
                console.error("Error respuesta:", this.responseText);
            }
        }
    };

    xhttp.open("POST", `${apiBase}/carro/anadir`, true);
    xhttp.send(datos);
    
    cerrarModal(); // Cerramos tras confirmar
}

// Función para mostrar alertas de error personalizadas, porque no me gusta lo de localhost dice
function mostrarAlertaError(mensaje) {
    const alerta = document.getElementById('alertaError');
    const texto = document.getElementById('mensajeAlertaError');

    // 1. Ponemos el mensaje y activamos el display
    texto.innerText = mensaje;
    alerta.style.display = 'block';

    // 2. Animación de entrada (fade in)
    setTimeout(() => alerta.classList.add('show'), 10);

    // 3. El auto-cierre (5 segundos)
    setTimeout(() => {
        // Quitamos la clase de visibilidad
        alerta.classList.remove('show');

        // Cuando termine la animación de Bootstrap, quitamos el display
        setTimeout(() => {
            alerta.style.display = 'none';
        }, 150); 
        
    }, 5000);
}

// Función para mostrar alertas de éxito personalizadas
function mostrarAlertaExito(mensaje) {
    const alerta = document.getElementById('alertaExito');
    const contenedorMensaje = document.getElementById('mensajeAlertaExito');

    //Insertar el texto
    contenedorMensaje.innerText = mensaje;

    //Hacerla visible
    alerta.style.display = 'block'; // Aseguramos que el navegador lo renderice
    
    // Pequeño delay para que la animación "fade" de Bootstrap funcione
    setTimeout(() => {
        alerta.classList.add('show');
    }, 10);

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        alerta.classList.remove('show');
        
        // Esperamos a que termine la animación de desvanecimiento para quitar el display
        setTimeout(() => {
            alerta.style.display = 'none';
        }, 150); 
    }, 3000);
}
// Función para mostrar modal de confirmación basicamente que si quiere de verdar este pedido antes de comprar
function mostrarModalConfirmacion() {
  const miModal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
    miModal.show();
}



// Función para finalizar el pedido
function finalizarPedido() {
    
            
            var xhttp = new XMLHttpRequest();
            
            xhttp.onload = function() {
                
                //si todo va bien nos mostrará el mensaje de exito
                if (this.status === 200) {
                    try {
                        var respuesta = JSON.parse(this.responseText);
                        if (respuesta.exito) {
                            mostrarAlertaExito(respuesta.mensaje);
                            
                            // Limpiar y recargar la cesta después de 1 segundo
                            setTimeout(() => {
                                var cuerpoCesta = document.getElementById("contenedorCestaBody");
                                cuerpoCesta.innerHTML = '';
                                mostrarCesta();
                            }, 1000);
                            // Recargar productos y categorías para actualizar stock
                            cargarCategorias();           // Cargar las pestañas de categorías
                            verificarSesion();            // Verificar si hay sesión activa (clave para mantener login)
                            cargarProductosPorDefecto(1); // Mostrar productos de la primera categoría
                        } else {
                            mostrarAlertaError(respuesta.error);
                        }
                    } catch (e) {
                        mostrarAlertaError("Respuesta inválida del servidor (no es JSON)");
                    } finally{
                        cerrarModalConfirmacion(); // Cerrar el modal de confirmación en cualquier caso
                    }
                } else {
                    mostrarAlertaError("Error HTTP " + this.status + ": " + this.statusText);
                }
            };
            
            //para los errores que puede haber pero que no los pille el if de arriba, como problemas de red o que el servidor no responda, mostramos un mensaje de error genérico
            xhttp.onerror = function() {
                mostrarAlertaError("Error de conexión con el servidor");
            };
            
            xhttp.open("POST", `${apiBase}/pedido/finalizar`, true);
            xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhttp.send();
}


// Para cerrar el modal
function cerrarModalConfirmacion() {
    const elementoModal = document.getElementById('modalConfirmacion');
    const instanciaModal = bootstrap.Modal.getInstance(elementoModal);
    if (instanciaModal) {
        instanciaModal.hide();
    }
}




