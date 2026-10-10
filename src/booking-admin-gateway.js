/** Une sesión Supabase y cliente privado sin montar UI ni desplegar rutas. */
import {createBookingAdminSession} from './booking-admin-session.js';
import {createBookingPanelClient} from './booking-panel-client.js';
export function createBookingAdminGateway({supabase,endpoint='/api/private/bookings',fetchImpl}){
 const session=createBookingAdminSession({supabase});
 const client=createBookingPanelClient({endpoint,getAccessToken:()=>session.getAccessToken(),fetchImpl});
 return Object.freeze({
   counts:eventId=>client.counts(eventId),
   confirm:(eventId,id)=>client.confirm(eventId,id),
   cancel:(eventId,id)=>client.cancel(eventId,id),
   signOut:()=>session.signOut()
 });
}
