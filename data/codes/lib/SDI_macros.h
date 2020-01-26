#ifndef ___PRJNAME___SDI_MACROS_H
#define ___PRJNAME___SDI_MACROS_H

#ifdef __amigaos4__
#define __BASE_OR_IFACE_TYPE	struct __IFaceName__ *
#define __BASE_OR_IFACE_VAR		__IFacePtr__
#else
#define __BASE_OR_IFACE_TYPE	struct __BaseName__ *
#define __BASE_OR_IFACE_VAR		__BaseName__
#endif

#define __BASE_OR_IFACE __BASE_OR_IFACE_TYPE __BASE_OR_IFACE_VAR

#endif /* ___PRJNAME___SDI_MACROS_H */
