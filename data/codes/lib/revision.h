// This file is a part of __PrjName__

#define VERSION		0
#define REVISION	1
#define RSTRING   "0.1"
#define LIBNAME   "__prjname__.library"
#ifdef __SASC
  #define DATE __AMIGADATE__
#elif  _DCC
  #define DATE __COMMODORE_DATE__
#else
  #define DATE __DATE__
#endif
#define VERS		  LIBNAME " " RSTRING
#define VSTRING		VERS " (" DATE ")\r\n"
#define VERSTAG		"\0$VER: " VERS " (" DATE ")"
