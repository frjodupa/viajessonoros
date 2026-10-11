/** Composición cerrada de registro público, sin activar rutas ni despliegue.
 * La instancia exige verificación antiabuso, experiencia y claves del servidor.
 */
import {createBookingContactProtector} from './booking-contact-protection.js';
import {createProtectedBookingRegistration} from './booking-protected-registration.js';
import {createPublicBookingHttpHandler} from './booking-public-http-handler.js';
export async function createBookingPublicService({db,encryptionKeyBase64,hashKeyBase64,verifyAbuse,verifyEvent,cryptoImpl=crypto}={}){
 if(!db?.prepare||typeof verifyAbuse!=='function'||typeof verifyEvent!=='function'||!cryptoImpl?.randomUUID)
  throw Error('PUBLIC_BOOKING_CONFIGURATION_REQUIRED');
 const protector=await createBookingContactProtector({encryptionKeyBase64,hashKeyBase64,cryptoImpl});
 const registration=createProtectedBookingRegistration({
  db,protector,verifyEvent,idFactory:()=> 'BOOK-'+cryptoImpl.randomUUID()
 });
 return createPublicBookingHttpHandler({register:input=>registration.register(input),verifyAbuse});
}
