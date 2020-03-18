// This file is a part of __PrjName__

///includes
#ifdef __MORPHOS__
  #include <emul/emulinterface.h>
  #include <emul/emulregs.h>
#endif

#include <exec/exec.h>
#include <proto/exec.h>
#include <dos/dos.h>

#include <SDI_lib.h>
#include "SDI_macros.h"

#include <proto/__prjname__.h>

#include "revision.h"
#include "__prjname__base.h"
///
///definitions
#ifndef __amigaos4__
  #define DeleteLibrary(LIB) \
    FreeMem((STRPTR)(LIB)-(LIB)->lib_NegSize, (ULONG)((LIB)->lib_NegSize+(LIB)->lib_PosSize))
#endif
///
///globals
#ifdef __GNUC__
  volatile STATIC CONST UBYTE USED_VAR __attribute__((section(".text"))) VersionTag[] = VERSTAG;
#else
  CONST UBYTE USED_VAR VersionTag[] = VERSTAG;
#endif

#ifdef __MORPHOS__
/******************************************************************************
 * Inform the loader that this is an emulppc elf and not a ppc.library one.   *
 ******************************************************************************/
  const USED_VAR ULONG __amigappc__ = 1;
  const USED_VAR ULONG __abox__ = 1;
#endif

#ifdef __amigaos4__
struct ExecIFace *IExec;
#else
struct ExecBase *SysBase;
#endif
///
///entry
// If a user tries to execute this binary it should return safely
#if !defined (__amigaos4__) && !defined (__MORPHOS__)
  asm(".text\n\tjra __start\n");
#endif
LONG _start( void )
{
  return RETURN_FAIL;
}
///

/*******************************************************************************
 * Standard Library Functions                                                  *
 ******************************************************************************/
///libProtos
#ifdef __amigaos4__
  STATIC LIBFUNC struct __BaseName__ *libInit(struct __BaseName__ *, BPTR, struct ExecIFace *);
  STATIC LIBFUNC BPTR libExpunge(struct LibraryManagerInterface *);
  STATIC LIBFUNC struct __BaseName__ *libOpen(struct LibraryManagerInterface *, ULONG);
  STATIC LIBFUNC BPTR libClose(struct LibraryManagerInterface *);
  STATIC LIBFUNC ULONG libObtain(struct LibraryManagerInterface *);
  STATIC LIBFUNC ULONG libRelease(struct LibraryManagerInterface *);
#elif __MORPHOS__
  STATIC LIBFUNC struct __BaseName__ *libInit(struct __BaseName__ *, BPTR, struct ExecBase *);
  STATIC LIBFUNC BPTR libExpunge(void);
  STATIC LIBFUNC struct __BaseName__ *libOpen(void);
  STATIC LIBFUNC BPTR libClose(void);
#else
  STATIC LIBFUNC struct __BaseName__ *libInit(REG(a0, BPTR), REG(a6, struct ExecBase *));
  STATIC LIBFUNC BPTR libExpunge(REG(a6, struct __BaseName__ *));
  STATIC LIBFUNC struct __BaseName__ *libOpen(REG(a6, struct __BaseName__ *));
  STATIC LIBFUNC BPTR libClose(REG(a6, struct __BaseName__ *));
#endif
///
///libVectors
#include "vectors.h"
#ifndef libvector
#error libvector is not defined in vectors.h
#endif

#ifndef __amigaos4__
STATIC LONG LIBFUNC libNull(void)
{
  return(0);
}
#endif

static const APTR libVectors[] =
{
  #ifdef __amigaos4__
  (APTR)libObtain,
  (APTR)libRelease,
  (APTR)NULL,
  (APTR)NULL,
  #else
  #ifdef __MORPHOS__
  (APTR)FUNCARRAY_32BIT_NATIVE,
  #endif
  (APTR)libOpen,
  (APTR)libClose,
  (APTR)libExpunge,
  (APTR)libNull,
  #endif
  libvector,
  (APTR)-1
};
///
///libInit
#ifdef __amigaos4__
  STATIC LIBFUNC struct __BaseName__ *libInit(struct __BaseName__ *base, BPTR seglist, struct ExecIFace *exec)
  {
    IExec = exec;
#elif __MORPHOS__
  STATIC LIBFUNC struct __BaseName__ *libInit(struct __BaseName__ *base, BPTR seglist, struct ExecBase *sysbase)
  {
    SysBase = sysbase;
#else
  STATIC LIBFUNC struct __BaseName__ *libInit(REG(a0, BPTR seglist), REG(a6, struct ExecBase *sysbase))
  {
    struct __BaseName__ *base;
    SysBase = sysbase;
    if((base = (struct __BaseName__ *)MakeLibrary((APTR)libVectors, NULL, NULL, sizeof(struct __BaseName__), NULL)))
    {
#endif
      base->libNode.lib_Node.ln_Type = NT_LIBRARY;
      base->libNode.lib_Node.ln_Pri  = 0;
      base->libNode.lib_Node.ln_Name = LIBNAME;
      base->libNode.lib_Flags        = LIBF_SUMUSED|LIBF_CHANGED;
      base->libNode.lib_Version      = VERSION;
      base->libNode.lib_Revision     = REVISION;
      base->libNode.lib_IdString     = VSTRING;

      base->segList = seglist;

      #ifdef USE_SEMAPHORE
        InitSemaphore(&base->libSemaphore);
      #endif

      // Add your additional init code here

#if !defined(__amigaos4__) && !defined(__MORPHOS__)
      AddLibrary((struct Library *)base);
    }
#endif

    return base;
  }

#ifdef __MORPHOS__
  STATIC CONST IPTR libInitTab[] =
  {
    sizeof(struct __BaseName__),
    (IPTR)libVectors,
    (IPTR)NULL,
    (IPTR)libInit
  };
#endif
///
///libExpunge
#ifdef __amigaos4__
  STATIC LIBFUNC BPTR libExpunge(struct LibraryManagerInterface *Self)
  {
    struct __BaseName__ *base = (struct __BaseName__ *)Self->Data.LibBase;
#elif __MORPHOS__
  STATIC LIBFUNC BPTR libExpunge(void)
  {
    struct __BaseName__ *base = (void *)REG_A6;
#else
  STATIC LIBFUNC BPTR libExpunge(REG(a6, struct __BaseName__ *base))
  {
#endif
    BPTR result;

    if (base->libNode.lib_OpenCnt == 0)
    {
      result = base->segList;

      // Undo what your additional init code did

      Remove((struct Node *)base);
      DeleteLibrary((struct Library *)base);
    }
    else
    {
      result = (BPTR)0;
      base->libNode.lib_Flags |= LIBF_DELEXP;
    }

    return(result);
  }
///
///libOpen
#ifdef __amigaos4__
  STATIC LIBFUNC struct __BaseName__ *libOpen(struct LibraryManagerInterface *Self, ULONG version)
  {
    struct __BaseName__ *base = (struct __BaseName__ *)Self->Data.LibBase;
    if (version > VERSION) return NULL;
#elif __MORPHOS__
  STATIC LIBFUNC struct __BaseName__ *libOpen(void)
  {
    struct __BaseName__ *base = (void *)REG_A6;
#else
  STATIC LIBFUNC struct __BaseName__ *libOpen(REG(a6, struct __BaseName__ *base))
  {
#endif

    // Cancel a possible "delayed expunge"
    base->libNode.lib_Flags &= ~LIBF_DELEXP;

    #ifdef USE_SEMAPHORE
      ObtainSemaphore(&base->libSemaphore);
    #endif

    /* Add any specific open code here
       Return NULL before incrementing OpenCnt to fail opening */

    // Increment the open count
    base->libNode.lib_OpenCnt++;

    #ifdef USE_SEMAPHORE
      ReleaseSemaphore(&base->libSemaphore);
    #endif

    return (struct __BaseName__ *)base;
  }
///
///libClose
#ifdef __amigaos4__
  STATIC LIBFUNC BPTR libClose(struct LibraryManagerInterface *Self)
  {
    struct __BaseName__ *base = (struct __BaseName__ *)Self->Data.LibBase;
#elif __MORPHOS__
  STATIC LIBFUNC BPTR libClose(void)
  {
    struct __BaseName__ *base = (struct __BaseName__ *)REG_A6;
#else
  STATIC LIBFUNC BPTR libClose(REG(a6, struct __BaseName__ *base))
  {
#endif
    BPTR result = 0;

    #ifdef USE_SEMAPHORE
      ObtainSemaphore(&base->libSemaphore);
    #endif

    // Decrement the open count
    base->libNode.lib_OpenCnt--;

    #ifdef USE_SEMAPHORE
      ReleaseSemaphore(&base->libSemaphore);
    #endif

    if(base->libNode.lib_OpenCnt == 0 &&
       base->libNode.lib_Flags & LIBF_DELEXP)
    {
      #ifdef __amigaos4__
        result = libExpunge(Self);
      #elif __MORPHOS__
        result = libExpunge();
      #else
        result = libExpunge(base);
      #endif
    }

    return(result);
  }
///
///libManager
#ifdef __amigaos4__
  STATIC LIBFUNC ULONG libObtain(struct LibraryManagerInterface *Self)
  {
     return(Self->Data.RefCount++);
  }

  STATIC LIBFUNC ULONG libRelease(struct LibraryManagerInterface *Self)
  {
     return(Self->Data.RefCount--);
  }

  STATIC CONST APTR libManagerVectors[] =
  {
  	libObtain,
  	libRelease,
  	NULL,
  	NULL,
  	libOpen,
  	libClose,
  	libExpunge,
  	NULL,
  	(APTR)-1
  };

  STATIC CONST struct TagItem libManagerTags[] =
  {
  	{ MIT_Name,			    (Tag)"__library"       },
  	{ MIT_VectorTable,	(Tag)libManagerVectors },
  	{ MIT_Version,		  1                      },
  	{ TAG_DONE,			    0                      }
  };
#endif
///
///libInterfaces
#ifdef __amigaos4__
  STATIC CONST struct TagItem mainTags[] =
  {
     {MIT_Name,        (ULONG)"main"},
     {MIT_VectorTable, (ULONG)libVectors},
     {MIT_Version,     1},
     {TAG_DONE,        0}
  };

  STATIC CONST ULONG libInterfaces[] =
  {
     (ULONG)libManagerTags,
     (ULONG)mainTags,
     (ULONG)0
  };

  #ifndef NO_VECTABLE68K
  extern CONST APTR VecTable68K[];
  #endif

  STATIC CONST struct TagItem libCreateTags[] =
  {
  	{ CLT_DataSize,		sizeof(struct __BaseName__)},
  	{ CLT_InitFunc,		(Tag)libInit			      },
  	{ CLT_Interfaces,	(Tag)libInterfaces		  },
    #ifndef NO_VECTABLE68K
  	{ CLT_Vector68K, (Tag)VecTable68K },
    #endif
  	{TAG_DONE,		 0 }
  };
#endif
///
///ROMTAG
STATIC CONST USED_VAR struct Resident ROMTag =
{
  RTC_MATCHWORD,
  (struct Resident *)&ROMTag,
  (APTR)&ROMTag + 1,            // EndCode
  #if defined(__amigaos4__)
  RTF_AUTOINIT|RTF_NATIVE,      // Add RTF_COLDSTART to be reset resident
  #elif defined(__MORPHOS__)
  RTF_AUTOINIT | RTF_PPC | RTF_EXTENDED,
  #else
  0,
  #endif
  VERSION,
  NT_LIBRARY,
  0,                             // PRIORITY not needed unless reset resident
  (char *)LIBNAME,
  (char *)VSTRING,
  #if defined(__amigaos4__)
  (APTR)libCreateTags,
  #elif defined(__MORPHOS__)
  (APTR)libInitTab,
  #else
  (APTR)libInit,
  #endif
  #if defined(__MORPHOS__)
  REVISION,
  0
  #endif
};
///
