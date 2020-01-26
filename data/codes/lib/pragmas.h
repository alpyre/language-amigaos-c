#ifndef PRAGMAS___PRJNAME___PRAGMAS_H
#define PRAGMAS___PRJNAME___PRAGMAS_H

// This file is a part of __PrjName__

#if defined(LATTICE) || defined(__SASC) || defined(_DCC)
  #ifndef __CLIB_PRAGMA_LIBCALL
    #define __CLIB_PRAGMA_LIBCALL
  #endif
#else /* __MAXON__, __STORM__ or AZTEC_C */
  #ifndef __CLIB_PRAGMA_AMICALL
    #define __CLIB_PRAGMA_AMICALL
  #endif
#endif

#if defined(__SASC_60) || defined(__STORM__)
  #ifndef __CLIB_PRAGMA_TAGCALL
    #define __CLIB_PRAGMA_TAGCALL
  #endif
#endif
