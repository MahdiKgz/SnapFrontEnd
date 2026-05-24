import { AntdProvider } from "./app/providers/AntdProvider";

const App = () => {
  return (
    <AntdProvider>
      <div className="min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold text-center p-8">سلام دنیا</h1>
      </div>
    </AntdProvider>
  );
};

export default App;
