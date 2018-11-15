#define AUTHOR          "Author Name"
#define COPYRIGHT       "© 2018 " AUTHOR
#define CONTACT         "author@mail.com"
#define DESCRIPTION     "Program Description"
/*SPLIT*/
//missing definitions in NDK & SDK
#if !defined (__MORPHOS__)
  #define MAX(a, b) (a > b ? a : b)
  #define MIN(a, b) (a > b ? b : a)
#endif
/*SPLIT*/
/* MUI headers */
#include <libraries/mui.h>
#include <proto/muimaster.h>
#include <workbench/workbench.h>
/*SPLIT*////MUI globals
struct Library *MUIMasterBase;
#if defined(__amigaos4__)
  struct MUIMasterIFace *IMUIMaster;
#endif
Object *App, *Win, *btn_Bye;

#ifdef __GNUC__
/* Otherwise auto open will try version 37, and muimaster.library has version
   19.x for MUI 3.8 */
int __oslibversion = 0;
#endif
///
/*SPLIT*/Object *       buildGUI(void);
/*SPLIT*////buildGUI
/***********************************************
 * Program main window                         *
 * - Creates the MUI Application object.       *
 ***********************************************/
Object *buildGUI()
{
  App = MUI_NewObject(MUIC_Application,
    MUIA_Application_Author, (ULONG)AUTHOR,
    MUIA_Application_Base, (ULONG)PROGRAMNAME,
    MUIA_Application_Copyright, (ULONG)COPYRIGHT,
    MUIA_Application_Description, (ULONG)DESCRIPTION,
    MUIA_Application_Title, (ULONG)PROGRAMNAME,
    MUIA_Application_Version, (ULONG)VersionTag,
    MUIA_Application_Window, (Win = MUI_NewObject(MUIC_Window,
      MUIA_Window_Title, (ULONG)PROGRAMNAME,
      MUIA_Window_Height, MIN(500, MUIV_Window_Height_Screen(80)),
      MUIA_Window_Width, MIN(512, MUIV_Window_Width_Screen(55)),
      MUIA_Window_RootObject, MUI_NewObject(MUIC_Group,
        MUIA_Group_Child, MUI_NewObject(MUIC_Text,
          MUIA_Text_Contents, (ULONG)"Hello world!",
        TAG_END),
        MUIA_Group_Child, (btn_Bye = MUI_NewObject(MUIC_Text,
          MUIA_InputMode , MUIV_InputMode_RelVerify,
          MUIA_Frame, MUIV_Frame_Button,
          MUIA_Background , MUII_ButtonBack,
          MUIA_Font, MUIV_Font_Button,
          MUIA_Text_Contents, (ULONG)"Bye!",
        TAG_END)),
      TAG_END),
    TAG_END)),
  TAG_END);

  //Notifications
  if (App)
  {
    DoMethod(Win, MUIM_Notify, MUIA_Window_CloseRequest, TRUE, App, 2,
      MUIM_Application_ReturnID, MUIV_Application_ReturnID_Quit);

    DoMethod(btn_Bye, MUIM_Notify, MUIA_Pressed, FALSE, App, 2,
       MUIM_Application_ReturnID, MUIV_Application_ReturnID_Quit);
  }

  return App;
}
///
///main
/***********************************************
 * Developer level main                        *
 * - Code your program here.                   *
 ***********************************************/
int Main(struct Config *config)
{
  int rc = 0;

  if (MUIMasterBase = OpenLibrary("muimaster.library", 0))
  {
#if defined(__amigaos4__)
		if (IMUIMaster = (struct MUIMasterIFace *)GetInterface(MUIMasterBase, "main", 1, NULL))
    {
#endif
      if (buildGUI())
      {
        ULONG signals = 0;
        BOOL running = TRUE;

        set(Win, MUIA_Window_Open, TRUE);

        while(running)
        {
          ULONG id = DoMethod (App, MUIM_Application_NewInput, &signals);
          switch(id)
          {
            case MUIV_Application_ReturnID_Quit:
              running = FALSE;
            break;
          }
          if(running && signals) signals = Wait(signals | SIGBREAKF_CTRL_C);
          if (signals & SIGBREAKF_CTRL_C) break;
        }

        set(Win, MUIA_Window_Open, FALSE);

        MUI_DisposeObject(App);
      }
      else rc = 20;

#if defined(__amigaos4__)
      DropInterface((struct Interface *)IMUIMaster);
    }
    else rc = 20;
#endif
    CloseLibrary(MUIMasterBase);
  }
  else rc = 20;

  return(rc);
}
///
