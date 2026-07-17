const URL_BASE = `https://api.nhtsa.gov/SafetyRatings`; 

// Variables para almacenar los elementos del DOM
let YEAR_SELECT = document.getElementById("year");
let MAKER_SELECT = document.getElementById("marca_auto");
let MODEL_SELECT = document.getElementById("modelo_auto");
let VERSION_SELECT = document.getElementById("version_auto");
let RESULTADOS_SPAN = document.getElementById("resultados");

// Variables de cada etiqueta
const IMG_FRONTAL = document.getElementById("img_frontal");
const IMG_LATERAL = document.getElementById("img_lateral");
const IMG_POSTE = document.getElementById("img_poste");
 
const RATING_FRENTE = document.getElementById("rating_frente");
const RATING_CONDUCTOR = document.getElementById("rating_conductor");
const RATING_PASAJERO = document.getElementById("rating_pasajero");
 
const RATING_LATERAL = document.getElementById("rating_lateral");
const RATING_CONDUCTOR_LATERAL = document.getElementById("rating_conductor_lateral");
const RATING_PASAJERO_LATERAL = document.getElementById("rating_pasajero_lateral");
 
const RATING_POSTE = document.getElementById("rating_poste");
const RATING_VUELCO = document.getElementById("rating_vuelco");
const RATING_PROBABILIDAD = document.getElementById("rating_probabilidad");

const INFORMACION_AUTO_SELECCIONADO = document.getElementById("texto_auto_seleccionado");

// Contenedor completo de la tarjeta de resultados (imágenes + ratings).
// Se mantiene oculto hasta que haya datos válidos para mostrar.
const RESULTADOS_CONTENEDOR = document.getElementById("Resultados");

// Bloque "Resultados de seguridad para: ..." — igual que la tarjeta,
// se mantiene oculto hasta que haya un vehículo seleccionado con datos.
const INFO_AUTO_CONTENEDOR = document.querySelector(".info_auto");

// Oculta la tarjeta de resultados. Se llama cada vez que el usuario
// cambia cualquier select, para no dejar datos "viejos" visibles
// mientras se resuelve la nueva búsqueda.
function OcultarResultados() {
    RESULTADOS_CONTENEDOR.classList.remove("visible");
    INFO_AUTO_CONTENEDOR.classList.remove("visible");
}

// Muestra la tarjeta de resultados. Solo se llama después de confirmar
// que la info del vehículo tiene datos reales (ver Viewinfocar).
function MostrarResultados() {
    RESULTADOS_CONTENEDOR.classList.add("visible");
    INFO_AUTO_CONTENEDOR.classList.add("visible");
}

// marcas disponibles para un año dado
async function GetMakers(year) {
    let response = await fetch(`${URL_BASE}/modelyear/${year}?format=json`);
    let data = await response.json();
    return data.Results; 
}

// modelos de una marca en un año seleccionado
async function GetModels(year, maker) {
    let response = await fetch(`${URL_BASE}/modelyear/${year}/make/${maker}?format=json`);
    let data = await response.json();
    console.log(data.Results); 
    return data.Results; 
}

async function GetVersions(year, maker, model) {
    let response = await fetch(`${URL_BASE}/modelyear/${year}/make/${maker}/model/${model}?format=json`);
    let data = await response.json();
    return data.Results; 
}

async function GetVehicleInfo(vehicleId) {
    let response = await fetch(`${URL_BASE}/VehicleId/${vehicleId}?format=json`);
    let data = await response.json();
    return data.Results; 
}


// Limpia un select y le deja solo la opción por defecto, recibe el select, nombre del select a limpiar, y un placeholder que es el texto del select.
function ResetSelect(select, placeholder) {
    select.innerHTML = "";
    let defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = placeholder;
    select.appendChild(defaultOption);
}


// 7. FillSelect, fue hecho con el objectivo de hacer mas dinamica el flujo y evitar ciclos for en cada iteraccion. Lo que hace es lo siguiente: Recibe como paramtro de entradas, un select (el nombre del select donde a cargar), los items (el contenido a cargar), y fieldname que es el nombre que representa a cada select. 
function FillSelect(select, items, fieldName) {
    // Aca dice: para cada objecto de la repuesta, vas a hacer reiteradamente:
    items.forEach(item => {
        // creamos el option para tener una nueva opcion dentro del select.
        let option = document.createElement("option");
        //  el valor y texto a cargar lo vas a hacer en el select del item segun su nombre identificador.
        option.value = item[fieldName];
        option.text = item[fieldName];
        select.appendChild(option);
        // Vas a agregar en el select, las opciones.
    });
}

// 2. Es la segunda funcion en ejecutarse. Aca la funcion va a cargar los años.
function GetYears() {
    // Para hacerlo dinamico, la variable 'currentyear' va a almacenar el año actual, eso se logra a traves de la funcion 'new Date().getFullYear()' que nos devuelve el año actual.
    let currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2010; year--) {
        // Aca el for inicia en el año 'currentyear' y de manera decremental va a ir restando de a uno hasta llegar al año 2010, ya que el condicionante es mayor E IGUAL a 2010.
        // Por cada año que se cargue, se va a crear un nuevo elemento 'option'.
        let option = document.createElement("option");
        // A cada elemento 'option' se le va a asignar el valor del año y el texto que se va a mostrar en el select.
        option.value = year;
        option.text = year;
        // Finalmente, cada elemento 'option' se va a agregar esos años en el select que corresponde a los años.
        YEAR_SELECT.appendChild(option);
    }
}

// En vez de cargar con bucles for los resultados devueltos por cada "consulta/peticion" a la API, vamos a usar eventos JavaScript. 
// Un evento JavaScript es similar a un trigger (disparador) que se activa siempre y cuando ocurra (valga la redundacia) un evento en particular. En este caso, el evento es el "CHANGE". Osea, cuando se MODIFIQUE el valor de un select, va a ejecutarse lo que se encuentre dentro de la funcion. 
// Nota de Fran: La idea es explicar el flujo de la api para que vean como funciona.

// 3. Cuando SE SELECCIONE UN AÑO en particular desde el select. Va a ocurrir lo siguiente: 
YEAR_SELECT.addEventListener("change", async () => {
    // Almacenamos en memoria el año seleccionado por el usuario en la variable del select de año.
    let year = YEAR_SELECT.value;

    // Aca entra un poco de razonamiento logico, al modificar el select de año, vamos a "limpiar" los select de marca, modelo y version, ya que al cambiar el año, las marcas, modelos y versiones disponibles pueden variar.
    ResetSelect(MAKER_SELECT, "Seleccione marca");
    ResetSelect(MODEL_SELECT, "Seleccione modelo");
    ResetSelect(VERSION_SELECT, "Seleccione versión");
    // En general al modificar algun select, limpiamos la repuestas (ya no tiene sentido mostrar algo que no pretende el usuario)
    RESULTADOS_SPAN.textContent = "";
    // Ocultamos la tarjeta: al cambiar de año, ya no corresponde
    // seguir mostrando los datos del vehículo anterior.
    OcultarResultados();

    // Si el usuario no selecciona un año, no hacemos nada.
    if (!year) return; 

    //Aca vamos a intentar lo siguiente:
    try {
        // Aca vamos a obtener las marcas. 
        let makers = await GetMakers(year);
        // Les aconcejo ir a la funcion de FillSelect. Pero en resumen, cargamos en el select de marcas las marcas.
        FillSelect(MAKER_SELECT, makers, "Make");
    } catch (error) {
        console.error("Error al obtener las marcas:", error);
    }
});

// 4. Cuando SELECCIONAMOS UNA MARCA en particular desde el select. Va a ocurrir lo siguiente:
MAKER_SELECT.addEventListener("change", async () => {
    // Almacenamos en memoria el año y la marca seleccionada por el usuario en las variables del select de año y marca.
    let year = YEAR_SELECT.value;
    let maker = MAKER_SELECT.value;

    // Volvemos a reestablecer los select de modelo y version.
    ResetSelect(MODEL_SELECT, "Seleccione modelo");
    ResetSelect(VERSION_SELECT, "Seleccione versión");
    RESULTADOS_SPAN.textContent = "";
    OcultarResultados();

    if (!maker) return;

    try {
        // buscamos los modelos segun el año y marca de auto seleccionado.
        let models = await GetModels(year, maker);
        // los cargamos en el select
        FillSelect(MODEL_SELECT, models, "Model");
    } catch (error) {
        console.error("Error al obtener los modelos:", error);
    }
});

// 5. Cuando SELECCIONAMOS un modelo desde el select, ocurre los siguiente:
MODEL_SELECT.addEventListener("change", async () => {
    // Mismo rumbo: almacenamos lo seleccionado por el usuario desde el select
    let year = YEAR_SELECT.value;
    let maker = MAKER_SELECT.value;
    let model = MODEL_SELECT.value;

    // Solo reseteamos la vesion
    ResetSelect(VERSION_SELECT, "Seleccione versión");
    RESULTADOS_SPAN.textContent = "";
    OcultarResultados();

    if (!model) return;

    // Chequeen esto:
    try {
        //Primero obtenemos todas las versiones del modelo solicitado
        let versions = await GetVersions(year, maker, model);
        // Ahora: vamos a filtrar el elemento json.
        let versionesFiltradas = await FilterVersion(versions); // Aca nos va a devolver un array que contrndra a las versiones filtradas.
        VERSION_SELECT.dataset.versions = JSON.stringify(versionesFiltradas);

        for (let i = 0; i < versionesFiltradas.length; i++) //.length sera la cantidad maxima de versiones a recorrer.
        {
            let option = document.createElement("option");
            option.value = versionesFiltradas[i].VehicleId;
            option.text = versionesFiltradas[i].VehicleDescription;
            VERSION_SELECT.appendChild(option);
        }

    } catch (error) {
        console.error("Error al obtener las versiones:", error);
    }
});

VERSION_SELECT.addEventListener("change", async () => {
    let vehicleId = VERSION_SELECT.value;

    RESULTADOS_SPAN.textContent = "";
    OcultarResultados();

    if (!vehicleId) return;

    try {
        let vehicleInfo = await GetVehicleInfo(vehicleId);
        RESULTADOS_SPAN.textContent = JSON.stringify(vehicleInfo, null, 2);
        // La informacion a cargar, se la pasamos a una nueva funcion que "rendirizara" el contenido en la interfaz.
        Viewinfocar(vehicleInfo);
    } catch (error) {
        console.error("Error al obtener la info del vehículo:", error);
    }
});

async function FilterVersion(versions)
{
    //La idea principal es que de todas las versiones, solicitar su informacion y ver que si la valoracion general es null descartarlo y no mostrarlo
    // La informacion filtrada se cargara en un array. 
    let versionesFiltradas = [];

    // por cada version que se obtenga.
    for (let i = 0; i < versions.length; i++)
    {
        // Aca, asignamos a la variable version un cuerpo JSON que va a filtrar, si llega a ver mas por cada iteraccion sobreescribira la informacion anterior por la version restante. 
        let version = versions[i];
        try
        {
            // Del array, hacemos referencia al id y obtenemos la informacion del vehiculo
            let info = await GetVehicleInfo(version.VehicleId);
            let overallRating;

            if (info && info[0])
            {
                // al resultado, iteramos y seleccionamos el valor de OverallRating y la guardamos momentaneamente en una variable.
                overallRating = info[0].OverallRating;
            }
            else
            {
                overallRating = undefined;
            }

            // filtramos por varias filtros.
            if (
                overallRating != "Not Rated" &&
                overallRating != "" &&
                overallRating != null &&
                overallRating != undefined &&
                overallRating != 0
            )
            {
                // si pasa el filtro, se le asigna a la estructura de la version su valoracion general.
                version.OverallRating = overallRating;
                // push hace agraegar la version filtrada al array.
                versionesFiltradas.push(version);
            }
        }
        catch(error)
        {
            console.error(error);
        }
    }

    return versionesFiltradas;
}

function FormatRating(value) {
    if (value === undefined || value === null || value === "" || value === "Not Rated") {
        return "Sin calificación";
    }
    return `${value} ★`;
}

// RENDERIZADO VISUAL: ESTRELLAS Y BARRA DE PORCENTAJE

// DrawStars: pinta 5 cuadraditos/estrellas dentro de "container".
// Los primeros "rating" (redondeado hacia abajo) quedan con la clase
// "activa" (color amarillo vía CSS), el resto queda gris.
// Si el rating no es un número válido (0, "Not Rated", null, etc.),
// se dibujan las 5 estrellas apagadas.
function DrawStars(container, rating) {
    // Limpiamos el contenedor por si ya tenía algo dibujado antes
    // (por ejemplo, al cambiar de vehículo).
    container.innerHTML = "";
    container.classList.add("rating-linea");

    let valor = Number(rating);
    if (isNaN(valor)) valor = 0;

    // Creamos 5 segmentos fijos (líneas/barritas en vez de estrellas).
    for (let i = 1; i <= 5; i++) {
        let segmento = document.createElement("span");
        segmento.classList.add("segmento");
        // Si el índice actual es menor o igual al rating, ese segmento
        // se pinta como "activo" (amarillo).
        if (i <= valor) {
            segmento.classList.add("activa");
        }
        container.appendChild(segmento);
    }
}

// DrawPercentBar: pinta una barra horizontal cuyo relleno llega hasta
// "porcentaje" (0 a 100). El color del relleno cambia según el rango:
// bajo (verde), medio (amarillo) o alto (rojo), ya que en este caso
// el porcentaje representa riesgo de vuelco (a mayor %, peor).
function DrawPercentBar(container, porcentaje) {
    container.innerHTML = "";

    let valor = Number(porcentaje);
    if (isNaN(valor)) valor = 0;
    // Limitamos el valor entre 0 y 100 por las dudas.
    valor = Math.max(0, Math.min(100, valor));

    // Envolvemos la barra y el número juntos para poder alinearlos
    // horizontalmente con flexbox (ver clase .barra-porcentaje-wrapper).
    let wrapper = document.createElement("div");
    wrapper.classList.add("barra-porcentaje-wrapper");

    let barraFondo = document.createElement("div");
    barraFondo.classList.add("barra-fondo");

    let barraRelleno = document.createElement("div");
    barraRelleno.classList.add("barra-relleno");
    barraRelleno.style.width = `${valor}%`;

    if (valor <= 33) {
        barraRelleno.classList.add("bajo");
    } else if (valor <= 66) {
        barraRelleno.classList.add("medio");
    } else {
        barraRelleno.classList.add("alto");
    }

    barraFondo.appendChild(barraRelleno);

    // Número al lado de la barra, con un decimal (ej: "24.2%").
    let numero = document.createElement("span");
    numero.classList.add("barra-porcentaje-numero");
    numero.textContent = `${valor.toFixed(1)}%`;

    wrapper.appendChild(barraFondo);
    wrapper.appendChild(numero);
    container.appendChild(wrapper);
}

//6. En esta funcion que tiene como parametro de entrada la informacion.
function Viewinfocar(vehicleInfo) {
    // Aca vamos a camprobar algo: Si existe la informacion del vehiculo (osea que no sea nulo)
    let info = vehicleInfo && vehicleInfo[0] ? vehicleInfo[0] : {};

    // Si "info" quedó vacío (objeto {}), significa que la API no
    // devolvió datos para este vehículo. En ese caso no mostramos la
    // tarjeta y cortamos acá: no tiene sentido pintar estrellas ni
    // barras con datos inexistentes.
    if (Object.keys(info).length === 0) {
        OcultarResultados();
        return;
    }
 
    //  Imágenes
    IMG_FRONTAL.src = info.FrontCrashPicture || IMG_PLACEHOLDER;
    IMG_LATERAL.src = info.SideCrashPicture || IMG_PLACEHOLDER;
    IMG_POSTE.src = info.SidePolePicture || IMG_PLACEHOLDER;
 
    //  Choque frontal (ahora se dibuja como estrellas en vez de texto)
    DrawStars(RATING_FRENTE, info.OverallFrontCrashRating);
    DrawStars(RATING_CONDUCTOR, info.FrontCrashDriversideRating);
    DrawStars(RATING_PASAJERO, info.FrontCrashPassengersideRating);
 
    //  Choque lateral 
    DrawStars(RATING_LATERAL, info.OverallSideCrashRating);
    DrawStars(RATING_CONDUCTOR_LATERAL, info.SideCrashDriversideRating);
    DrawStars(RATING_PASAJERO_LATERAL, info.SideCrashPassengersideRating);
 
    //  Choque contra poste y vuelco 
    DrawStars(RATING_POSTE, info.SidePoleCrashRating);
    DrawStars(RATING_VUELCO, info.RolloverRating);

    //  Probabilidad de vuelco: ahora se dibuja como barra de porcentaje.
    let porcentajeVuelco = info.RolloverPossibility != null
        ? (info.RolloverPossibility * 100)
        : 0;
    DrawPercentBar(RATING_PROBABILIDAD, porcentajeVuelco);

    // Informacion del auto seleccionado:
    INFORMACION_AUTO_SELECCIONADO.textContent = info.VehicleDescription;

    // Recién acá, con todos los datos ya pintados, mostramos la tarjeta.
    MostrarResultados();
}

// 0. Al inicializar el codigo JavaScript, siempre va a comenzar con la funcion main.
function main() {
    // 1. Como primera acccion que hacemos va a ser cargar los años.
    GetYears();
}

// 0.0: Aca invocamos la funcion main para que inicie con el codigo.
main();