/** Protección de contactos para el Worker (Web Crypto).
 * La clave AES-256-GCM debe residir sólo en secretos del servidor.
 */
const encoder=new TextEncoder();
function bytesToBase64(bytes){let str='';for(const b of bytes)str+=String.fromCharCode(b);return btoa(str)}
export async function createBookingContactProtector({encryptionKeyBase64,hashKeyBase64,cryptoImpl=crypto}={}){
 if(typeof encryptionKeyBase64!=='string'||typeof hashKeyBase64!=='string')throw Error('CONTACT_KEYS_REQUIRED');
 function decode(value){try{return Uint8Array.from(atob(value),c=>c.charCodeAt(0))}catch{throw Error('INVALID_CONTACT_KEY')}}
 const encryptionBytes=decode(encryptionKeyBase64),hashBytes=decode(hashKeyBase64);
 if(encryptionBytes.byteLength!==32||hashBytes.byteLength<32)throw Error('INVALID_CONTACT_KEY');
 const key=await cryptoImpl.subtle.importKey('raw',encryptionBytes,{name:'AES-GCM'},false,['encrypt']);
 const hmac=await cryptoImpl.subtle.importKey('raw',hashBytes,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return Object.freeze({
  async protect({eventId,name,phone}){
   if(typeof eventId!=='string'||!eventId.trim()||typeof name!=='string'||!name.trim()||typeof phone!=='string'||!phone.trim())throw Error('INVALID_CONTACT');
   const iv=cryptoImpl.getRandomValues(new Uint8Array(12));
   const plaintext=encoder.encode(JSON.stringify({name,phone}));
   const ciphertext=await cryptoImpl.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode(eventId)},key,plaintext);
   const digest=await cryptoImpl.subtle.sign('HMAC',hmac,encoder.encode(eventId+'\u0000'+phone));
   return Object.freeze({
    encryptedContact:'v1:'+bytesToBase64(iv)+':'+bytesToBase64(new Uint8Array(ciphertext)),
    contactHash:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')
   });
  }
 });
}
