import { HearManager } from "@puregram/hear";
import { MessageContext } from "puregram";

export function commandUserRoutes(hearManager: HearManager<MessageContext>): void { 
    hearManager.hear(
        '/strict',
        (context) => context.send('triggered by a strict string')
      )
      
}