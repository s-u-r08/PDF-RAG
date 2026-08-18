'use client'

import { Button, Input } from '@base-ui/react';
import * as React from 'react'

interface Doc{
    pageContent?:string;
    metadata?:{
        loc?:{
            pageNumber?:number;
        };
        source?:string;
    }
}

interface IMessage{
    role:'assistant'|'user';
    content?:string;
    documents?:Doc[];
}

const ChatComponent: React.FC=()=>{
    const [message,setMessage]=React.useState<string>('')
    const [messages,setMessages]=React.useState<IMessage[]>([])

const handleSendChatMessage = async () => {
  if (!message.trim()) return;

  try {
    const response = await fetch(
      `http://localhost:8000/chat?q=${encodeURIComponent(message)}`
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend error:", data);
      return;
    }

    console.log("Chat response:", data);

    setMessages((prev) => [
      ...prev,{role:'assistant',content:data?.message,documents:data?.docs}
    ]);

    setMessage("");
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

    return (
    <div className='p-4'>
        <div>
            {messages.map((message,index)=><pre key={index}>{JSON.stringify(message,null,2)}</pre>)}
        </div>
    <div className='fixed bottom-4 w-100 flex gap-3'>
        <Input value={message} onChange={e=>setMessage(e.target.value)} placeholder='Type your message here'/>
        <Button onClick={handleSendChatMessage} disabled ={!message.trim()} className='bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-blue-600'>Send</Button>
    </div>
    </div>
    )
}
export default ChatComponent;