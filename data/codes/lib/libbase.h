#ifndef ___PRJNAME___BASE_H
#define ___PRJNAME___BASE_H

// This file is a part of __PrjName__

struct __BaseName__
{
    struct Library libNode;
    BPTR segList;
  #ifdef USE_SEMAPHORE
    struct SignalSemaphore libSemaphore;
  #endif
    // Add your additional data fields here
};

#endif /* ___PRJNAME___BASE_H */
