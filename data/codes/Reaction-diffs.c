
//reaction headers
#include <classes/window.h>
#include <proto/window.h>
#include <proto/layout.h>
#include <proto/label.h>
#include <proto/string.h>
#include <gadgets/string.h>
#include <images/label.h>
#include <reaction/reaction_macros.h>
/*SPLIT*////reaction globals
// Gadget ID's
enum
{
  GID_ROOT=0,
  GID_STRING_HELLO,
  GID_BUTTON_BYE,
  NUMGADGETS
};

struct MsgPort *appPort = NULL;
struct Gadget *gadgets[NUMGADGETS];
Object *winObject = NULL;
///
/*SPLIT*/Object *       buildGUI(void);
void           disposeGUI(void);
/*SPLIT*////buildGUI
/***********************************************
 * Program main window                         *
 * - Creates a reaction window object.         *
 ***********************************************/
Object *buildGUI()
{
  if (appPort = (struct MsgPort *)CreateMsgPort())
  {
    winObject = (Object *)WindowObject,
      WA_Title, "Hello world!",
      WA_Activate, TRUE,
      WA_DepthGadget, TRUE,
      WA_DragBar, TRUE,
      WA_CloseGadget, TRUE,
      WA_SizeGadget, FALSE,
      WINDOW_IconifyGadget, TRUE,
      WINDOW_IconTitle, "Hello world",
      WINDOW_AppPort, appPort,
      WINDOW_Position, WPOS_CENTERMOUSE,
      WINDOW_ParentGroup, gadgets[GID_ROOT] = (struct Gadget *)VGroupObject,
        LAYOUT_AddChild, gadgets[GID_STRING_HELLO] = (struct Gadget *)StringObject,
          GA_ID, GID_STRING_HELLO,
          STRINGA_TextVal, "world!",
          GA_TabCycle, TRUE,
          GA_ReadOnly, TRUE,
        EndObject,
        CHILD_Label, LabelObject, LABEL_Text, "Hello", LabelEnd,

        LAYOUT_AddChild, HGroupObject,
          LAYOUT_AddChild, gadgets[GID_BUTTON_BYE] = ButtonObject,
            GA_ID, GID_BUTTON_BYE,
            GA_Text, "Bye!",
            GA_RelVerify, TRUE,
            GA_TabCycle, TRUE,
          EndObject,

        EndGroup,
      EndGroup,
      EndWindow;
  }
  return winObject;
}
///
///disposeGUI
void disposeGUI()
{
  if (winObject) DisposeObject(winObject);
  if (appPort) DeletePort(appPort);
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

  if (buildGUI())
  {
    struct Window *window = NULL;
    if (window = (struct Window *) RA_OpenWindow(winObject))
    {
      ULONG wait, signal, result;
      UWORD code;
      int done = FALSE;

      GetAttr(WINDOW_SigMask, winObject, &signal);

      while (!done)
      {
        wait = Wait(signal|SIGBREAKF_CTRL_C);

        if ( wait & SIGBREAKF_CTRL_C )
          done = TRUE;
        else
        {
          while ( (result = RA_HandleInput(winObject, &code) ) != WMHI_LASTMSG )
          {
            switch (result & WMHI_CLASSMASK)
            {
              case WMHI_CLOSEWINDOW:
                done = TRUE;
                break;
              case WMHI_ICONIFY:
                RA_Iconify(winObject);
                window = NULL;
                break;
              case WMHI_UNICONIFY:
                window = (struct Window *) RA_OpenWindow(winObject);

                if (window)
                  GetAttr(WINDOW_SigMask, winObject, &signal);
                else
                {
                  done = TRUE;
                  rc = 20; // re-opening window failed!
                }
                break;
              case WMHI_GADGETUP:
                switch (result & WMHI_GADGETMASK)
                {
                  case GID_BUTTON_BYE:
                    done = TRUE;
                    break;
                  default:;
                }
                break;
              default:;
            }
          }
        }
      }
    }
    else rc = 20;
  }
  else rc = 20;

  disposeGUI();
  return(rc);
}
///
/*SPLIT*/
#ifndef __amigaos4__
  INIT_3_ReActionLibs();
#endif
/*SPLIT*/
#ifndef __amigaos4__
  EXIT_3_ReActionLibs();
#endif
