/**
 * Guard de autorización para futuras rutas privadas de reservas.
 * El Worker debe pasar una función de verificación de identidad confiable,
 * nunca confiar en roles declarados por el cliente ni en JWT sin verificar.
 */
export async function requireBookingAdmin({authorization,verifyUser,isAdmin}){
  if(typeof verifyUser!=='function'||typeof isAdmin!=='function')
    throw Error('Validadores de servidor obligatorios');
  if(typeof authorization!=='string'||!/^Bearer [^\s]+$/.test(authorization))
    return {authorized:false,reason:'UNAUTHENTICATED'};
  const token=authorization.slice(7);
  let user;
  try{user=await verifyUser(token);}catch{return {authorized:false,reason:'UNAUTHENTICATED'};}
  if(!user||!user.id)return {authorized:false,reason:'UNAUTHENTICATED'};
  try{
    if(await isAdmin(user.id))return {authorized:true,userId:String(user.id)};
  }catch{return {authorized:false,reason:'FORBIDDEN'};}
  return {authorized:false,reason:'FORBIDDEN'};
}
