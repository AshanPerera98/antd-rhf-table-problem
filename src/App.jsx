import "./App.css";
import { Tabs } from "antd";
import Home from "./home/home";
import AntdTable from "./antd-table/antd-table";
import ReactHookFormTable from "./rhf-table/rhf-table";

function App() {
  return (
    <>
      <Tabs defaultActiveKey="1">
        <Tabs.TabPane tab="Home" key="1">
          <Home />
        </Tabs.TabPane>
        <Tabs.TabPane tab="AntdTable" key="2">
          <AntdTable />
        </Tabs.TabPane>
        <Tabs.TabPane tab="ReactHookFormTable" key="3">
          <ReactHookFormTable />
        </Tabs.TabPane>
      </Tabs>
    </>
  );
}

export default App;
