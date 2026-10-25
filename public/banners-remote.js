// Interfaz de sincronización: bloqueo deliberado hasta verificar infraestructura.
// No simular guardados remotos ni reutilizar permisos generales de reservas.
const status=document.getElementById('remote-status');
const controls=['remote-load','remote-save','remote-toggle'].map(id=>document.getElementById(id));
controls.forEach(button=>{button.disabled=true;button.title='Pendiente de migración y autorización específica de banners'});
if(status)status.textContent='Sin conexión de publicación: falta desplegar y verificar la tabla, almacenamiento de imágenes y permisos exclusivos para administradores de banners.';
