/** Adaptador de pruebas para conectar el prototipo móvil al presenter.
 * Únicamente datos ficticios en memoria. No se importa en la web pública.
 */
import {createBookingMobilePresenter} from './booking-mobile-presenter.js';
export function createDemoMobilePanel({onState}){
 const bookings=[
  {id:'DEMO-01',seats:2,status:'confirmed'},
  {id:'DEMO-02',seats:1,status:'pending'},
  {id:'DEMO-03',seats:2,status:'waitlist'}
 ];
 const eventId='DEMO-EVENT',capacity=12,minimum=6;
 const counts=()=>Object.fromEntries(['pending','confirmed','waitlist','cancelled'].map(status=>[
  status,bookings.filter(r=>r.status===status).reduce((n,r)=>n+r.seats,0)
 ]));
 const gateway={
  async counts(id){if(id!==eventId)throw Error('Evento inválido');return {eventId,counts:counts()};},
  async confirm(id,reservationId){
   if(id!==eventId)return {changed:false};
   const row=bookings.find(x=>x.id===reservationId);
   if(!row||!['pending','waitlist'].includes(row.status))return {changed:false};
   if(counts().confirmed+row.seats>capacity)throw Error('AFORO_COMPLETO');
   row.status='confirmed';return {changed:true};
  },
  async cancel(id,reservationId){
   if(id!==eventId)return {changed:false};
   const row=bookings.find(x=>x.id===reservationId);
   if(!row||row.status==='cancelled')return {changed:false};
   row.status='cancelled';return {changed:true};
  }
 };
 const presenter=createBookingMobilePresenter({gateway,eventId,capacity,minimum,onState});
 return Object.freeze({presenter,bookings:()=>bookings.map(row=>({...row}))});
}
