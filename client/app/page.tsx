import ChatComponent from "./components/chat";
import FileUploadComponent from "./components/file-upload";

export default function Home() {
  return (
    <div className="min-h-screen w-screen flex">
      
      {/* Left Sidebar */}
      <div className="w-[30vw] min-h-screen border-r-2 p-4 flex justify-center items-center">
        <FileUploadComponent/>
      </div>

      {/* Right Chat Area */}
      <div className="w-[70vw] min-h-screen">
        <ChatComponent/>
      </div>

    </div>
  );
}