/** Selector explícito del modo de reservas. No cambia la web ni instala rutas.
 * Producción requiere gateway autenticado; la demo solo usa memoria local.
 */
import {createDemoMobilePanel} from './booking-mobile-demo-controller.js';
import {createBookingMobilePresenter} from './booking-mobile-presenter.js';
export function createBookingPanelMode({mode,onState,gateway,eventId,capacity,minimum}){
 if(mode==='demo'){
  if(gateway!==undefined)throw Error('La demostración no puede recibir gateway real');
  const demo=createDemoMobilePanel({onState});
  return Object.freeze({mode:'demo',presenter:demo.presenter,bookings:demo.bookings});
 }
 if(mode==='admin'){
  if(!gateway||typeof gateway.counts!=='function'||typeof gateway.confirm!=='function'||typeof gateway.cancel!=='function')
   throw Error('Gateway privado obligatorio');
  if(typeof eventId!=='string'||!eventId.trim())throw Error('Evento requerido');
  return Object.freeze({mode:'admin',presenter:createBookingMobilePresenter({gateway,eventId,capacity,minimum,onState})});
 }
 throw Error('Modo de reservas no permitido');
}
