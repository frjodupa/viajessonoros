/** Conector de estado de la UI; usa exclusivamente el gateway administrativo.
 * No almacena JWT, asistentes ni contactos en el dispositivo.
 */
import {createBookingAdminPanel} from './booking-admin-panel.js';
export function createBookingMobilePresenter({gateway,eventId,capacity,minimum,onState}){
 if(typeof onState!=='function')throw Error('Actualización visual requerida');
 const panel=createBookingAdminPanel({gateway});
 let busy=false;
 const notify=(state)=>onState(Object.freeze(state));
 async function refresh(){
   if(busy)return false;
   busy=true;
   notify({phase:'loading'});
   try{
     const overview=await panel.overview({eventId,capacity,minimum});
     notify({phase:'ready',overview});
     return true;
   }catch{
     notify({phase:'error',message:'No se ha podido cargar la ocupación. Comprueba la sesión y vuelve a intentarlo.'});
     return false;
   }finally{busy=false;}
 }
 async function change(action,reservationId){
   if(busy)return false;
   if(!['confirm','cancel'].includes(action)||typeof reservationId!=='string'||!reservationId.trim())return false;
   busy=true;
   notify({phase:'saving'});
   try{
     const result=await panel.changeStatus({action,eventId,reservationId});
     if(!result?.changed)throw Error('unchanged');
   }catch{
     notify({phase:'error',message:'No se ha podido modificar la reserva. Actualiza la ocupación y vuelve a intentarlo.'});
     return false;
   }finally{busy=false;}
   return refresh();
 }
 return Object.freeze({refresh,change});
}
