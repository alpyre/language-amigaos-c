/******************************************************************************
 * Hello World                                                                *
 ******************************************************************************/

///definitions
#define PROGRAMNAME     "Hello World"/*SPLIT*/
#define VERSION         0
#define REVISION        1
#define VERSIONSTRING   "0.1"
/*SPLIT*/
//define command line syntax and number of options
#define RDARGS_TEMPLATE ""
#define RDARGS_OPTIONS  0

//#define or #undef GENERATEWBMAIN to enable workbench startup
#define GENERATEWBMAIN
/*SPLIT*////
///includes/*SPLIT*/
//Amiga headers
#include <exec/exec.h>
#include <dos/dos.h>
#include <dos/dostags.h>
#include <dos/dosextens.h>
#include <dos/datetime.h>
#include <graphics/gfx.h>
#include <graphics/gfxmacros.h>
#include <graphics/layers.h>
#include <intuition/intuition.h>
#include <intuition/intuitionbase.h>
#include <workbench/workbench.h>
#include <workbench/startup.h>
#include <workbench/icon.h>
#include <datatypes/pictureclass.h>
#include <libraries/asl.h>
#include <libraries/commodities.h>
#include <libraries/gadtools.h>
#include <libraries/iffparse.h>
#include <libraries/locale.h>
#include <rexx/rxslib.h>
#include <rexx/storage.h>
#include <rexx/errors.h>
#include <utility/hooks.h>

//Amiga protos
#include <clib/alib_protos.h>
#include <proto/asl.h>
#include <proto/commodities.h>
#include <proto/datatypes.h>
#include <proto/diskfont.h>
#include <proto/dos.h>
#include <proto/exec.h>
#include <proto/gadtools.h>
#include <proto/graphics.h>
#include <proto/icon.h>
#include <proto/iffparse.h>
#include <proto/intuition.h>
#include <proto/layers.h>
#include <proto/locale.h>
#include <proto/rexxsyslib.h>
#include <proto/utility.h>
#include <proto/wb.h>
/*SPLIT*////
///structures
/***********************************************
* Global configuration struct for this program *
************************************************/
struct Config
{
  struct RDArgs *RDArgs;

  //command line options
  #if RDARGS_OPTIONS
  LONG Options[RDARGS_OPTIONS];
  #endif

  //<YOUR GLOBAL DATA HERE>

};

//<YOUR STRUCTS HERE>

///
///globals
/***********************************************
* Version string for this program              *
************************************************/
#if defined(__SASC)
const UBYTE VersionTag[] = "$VER: " PROGRAMNAME " " VERSIONSTRING " "  __AMIGADATE__ "\n\0";
#elif defined(_DCC)
const UBYTE VersionTag[] = "$VER: " PROGRAMNAME " " VERSIONSTRING " (" __COMMODORE_DATE__ ")\n\0";
#elif defined(__GNUC__)
__attribute__((section(".text"))) volatile static const UBYTE VersionTag[] = "$VER: " PROGRAMNAME " " VERSIONSTRING " (" __DATE__ ")\n\0";
#else
const UBYTE VersionTag[] = "$VER: " PROGRAMNAME " " VERSIONSTRING " (" __DATE__ ")\n\0";
#endif
///
/*SPLIT*////prototypes
/***********************************************
* Function forward declarations                *
************************************************/
int            main   (int argc, char **argv);
int            wbmain (struct WBStartup *wbs);
struct Config *Init   (void);
int            Main   (struct Config *config);
void           CleanUp(struct Config *config);
/*SPLIT*////
///init
/***********************************************
* Program initialization                       *
* - Allocates the config struct to store the   *
*   global configuration data.                 *
* - Do your other initial allocations here.    *
************************************************/
struct Config *Init()
{
  struct Config *config = (struct Config*)AllocMem(sizeof(struct Config), MEMF_CLEAR);

  if (config)
  {
    //<YOUR INITIALIZATION CODE HERE>
  }

  return(config);
}
///
///entry
/***********************************************
 * Ground level entry point                    *
 * - Branches regarding Shell/WB call.         *
 ***********************************************/
int main(int argc, char **argv)
{
  int rc = 20;
/*SPLIT*/
  //argc != 0 identifies call from shell
  if (argc)
  {
    struct Config *config = Init();

    if (config)
    {
      #if RDARGS_OPTIONS
        // parse command line arguments
        if (config->RDArgs = ReadArgs(RDARGS_TEMPLATE, config->Options, NULL))
          rc = Main(config);
        else
          PrintFault(IoErr(), PROGRAMNAME);
      #else
        rc = Main(config);
      #endif

      CleanUp(config);
    }
  }
  else
    rc = wbmain((struct WBStartup *)argv);
/*SPLIT*/
  return(rc);
}

/***********************************************
 * Workbench main                              *
 * - This executable was called from Workbench *
 ***********************************************/
int wbmain(struct WBStartup *wbs)
{
  int rc = 20;

  #ifdef GENERATEWBMAIN
    struct Config *config = Init();

    if (config)
    {
      //<SET Config->Options[] HERE>

      rc = Main(config);

      CleanUp(config);
    }
  #endif

  return(rc);
}
///
/*SPLIT*////main
/***********************************************
 * Developer level main                        *
 * - Code your program here.                   *
 ***********************************************/
int Main(struct Config *config)
{
  int rc = 0;

  //<YOUR MAIN PROGRAM HERE>

  puts("Hello World!");

  return(rc);
}
///
/*SPLIT*////cleanup
/***********************************************
 * Clean up before exit                        *
 * - Free allocated resources here.            *
 ***********************************************/
void CleanUp(struct Config *config)
{
  if (config)
  {
    //<YOUR CLEAN UP CODE HERE>

    // free command line arguments
    #if RDARGS_OPTIONS
      if (config->RDArgs)
        FreeArgs(config->RDArgs);
    #endif

    FreeMem(config, sizeof(struct Config));
  }
}
///
