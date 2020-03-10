#ifndef PROTO___PRJNAME___H
#define PROTO___PRJNAME___H

// This file is a part of __PrjName__

#include <exec/types.h>
#include <dos/dos.h>

/****************************************************************************/

#ifndef __NOLIBBASE__
 extern struct Library * __BaseName__;
#endif /* __NOLIBBASE__ */

/****************************************************************************/

#ifdef __amigaos4__
 #include <interfaces/__prjname__.h>
 #ifdef __USE_INLINE__
  #include <inline4/__prjname__.h>
 #endif /* __USE_INLINE__ */
 #ifndef CLIB___PRJNAME___PROTOS_H
  #define CLIB___PRJNAME___PROTOS_H 1
 #endif /* CLIB___PRJNAME___PROTOS_H */
 #ifndef __NOGLOBALIFACE__
  extern struct __IFaceName__ *__IFacePtr__;
 #endif /* __NOGLOBALIFACE__ */
#else /* __amigaos4__ */
 #ifndef CLIB___PRJNAME___PROTOS_H
  #include <clib/__prjname___protos.h>
 #endif /* CLIB___PRJNAME___PROTOS_H */
 #if defined(__GNUC__)
  #ifdef __AROS__
   #include <defines/__prjname__.h>
  #else
   #ifndef __PPC__
    #include <inline/__prjname__.h>
   #else /* __PPC__ */
    #include <ppcinline/__prjname__.h>
   #endif /* __PPC__ */
  #endif /* __AROS__ */
 #elif defined(__VBCC__)
  #ifndef __PPC__
   #include <inline/__prjname___protos.h>
  #endif /* __PPC__ */
 #else /* __GNUC__ */
  #include <pragmas/__prjname___pragmas.h>
 #endif /* __GNUC__ */
#endif /* __amigaos4__ */

/****************************************************************************/

#endif /* PROTO___PRJNAME___H */
