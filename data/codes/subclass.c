/******************************************************************************
 * <SUBCLASS>
 ******************************************************************************/
/*SPLIT*/
///Includes/*SPLIT*/
#include <proto/exec.h>
#include <proto/utility.h>   // <-- Required for tag redirection
/*SPLIT*/
#include <libraries/mui.h>
#include <proto/muimaster.h>
/*SPLIT*/
#include <SDI_compiler.h>    //     Required for
#include <SDI_hook.h>        // <-- multi platform
#include <SDI_stdarg.h>      //     compatibility

#include "/*SPLIT*/.h"
///
///Structs
struct cl_ObjTable
{
  //<SUBCLASS CHILD OBJECT POINTERS HERE>
};

struct cl_Data
{
  struct cl_ObjTable obj_table;
  //<SUBCLASS VARIABLES HERE>
};

struct cl_Msg
{
  ULONG MethodID;
  //<SUBCLASS METHOD MESSAGE PAYLOAD HERE>
};
///
///DoSuperNew()
#if !defined(__MORPHOS__)
  Object* VARARGS68K DoSuperNew(struct IClass *cl, Object *obj, ...)
  {
    Object *rc;
    VA_LIST args;

    VA_START(args, obj);
    #if defined(__AROS__)
    rc = (Object *) DoSuperNewTagList(cl, obj, NULL, (struct TagItem *) VA_ARG(args, IPTR));
    #else
    rc = (Object *) DoSuperMethod(cl, obj, OM_NEW, VA_ARG(args, ULONG), NULL);
    #endif
    VA_END(args);

    return rc;
  }
#endif // !__MORPHOS__
///

//<DEFINE SUBCLASS METHODS HERE>

///Overridden OM_NEW
static ULONG m_New(struct IClass* cl, Object* obj, struct opSet* msg)
{
  struct cl_Data *data;

  if (obj = (Object *) DoSuperNew(cl, obj,
    //<SUPERCLASS TAGS HERE>
    TAG_MORE, msg->ops_AttrList))
  {
    data = (struct cl_Data*) INST_DATA(cl, obj);

    //<SUBCLASS INITIALIZATION HERE>

    return((ULONG) obj);
  }
  else CoerceMethod(cl, obj, OM_DISPOSE);

return NULL;
}
///
///Overridden OM_SET
//*****************
static ULONG m_Set(struct IClass* cl, Object* obj, struct opSet* msg)
{
  struct cl_Data* data = INST_DATA(cl, obj);
  struct TagItem *tags, *tag;

  for (tags = msg->ops_AttrList; tag = NextTagItem(&tags);)
  {
    switch (tag->ti_Tag)
    {
      //<SUBCLASS ATTRIBUTES HERE>
    }
  }

  return (DoSuperMethodA(cl, obj, (Msg) msg));
}
///
///Overridden OM_GET
//*****************
static ULONG m_Get(struct IClass* cl, Object* obj, struct opGet* msg)
{
  struct cl_Data* data = INST_DATA(cl, obj);

  switch (msg->opg_AttrID)
  {
    //<SUBCLASS ATTRIBUTES HERE>
  }

  return (DoSuperMethodA(cl, obj, (Msg) msg));
}
///
///Dispatcher
DISPATCHERPROTO(cl_Dispatcher)
{
  struct cl_Data* data;
  if (! (msg->MethodID == OM_NEW)) data = INST_DATA(cl, obj);

  switch(msg->MethodID)
  {
    case OM_NEW:
      return m_New(cl, obj, (struct opSet*) msg);
    case OM_SET:
      return m_Set(cl, obj, (struct opSet*) msg);
    case OM_GET:
      return m_Get(cl, obj, (struct opGet*) msg);

    //<DISPATCH SUBCLASS METHODS HERE>

    default:
      return DoSuperMethodA(cl, obj, msg);
  }
}
///
