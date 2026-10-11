/** Sesión administrativa para el panel: jamás persiste tokens ni los registra.
 * La autorización definitiva se comprueba de nuevo en el Worker.
 */
export function createBookingAdminSession({supabase}){
 if(!supabase?.auth?.getSession)throw Error('Supabase Auth requerido');
 return Object.freeze({
   async getAccessToken(){
     const {data,error}=await supabase.auth.getSession();
     if(error||!data?.session?.access_token)return null;
     const token=data.session.access_token;
     return typeof token==='string'&&token.length>0?token:null;
   },
   async signOut(){
     if(typeof supabase.auth.signOut!=='function')throw Error('Cierre de sesión no disponible');
     const {error}=await supabase.auth.signOut();
     if(error)throw Error('No se ha podido cerrar la sesión');
   }
 });
}
