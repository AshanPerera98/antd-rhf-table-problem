import "./App.css";
import { Tabs } from "antd";
import Home from "./home/home";
import AntdTable from "./antd-table/antd-table";
import ReactHookFormTable from "./rhf-table/rhf-table";
import EditableProTable from "./editable-pro-table/editable-pro-table";
import DataTableEditor from "./raw-table/data-table-editor";

import React, { useState, useEffect } from "react";

const tabKeyToHash = {
  1: "#home",
  2: "#antd",
  3: "#rhf",
  4: "#editable",
  5: "#raw",
};
const hashToTabKey = {
  "#home": "1",
  "#antd": "2",
  "#rhf": "3",
  "#editable": "4",
  "#raw": "5",
};

function App() {
  const [activeKey, setActiveKey] = useState(() => {
    const hash = window.location.hash;
    return hashToTabKey[hash] || "1";
  });

  useEffect(() => {
    const onHashChange = () => {
      setActiveKey(hashToTabKey[window.location.hash] || "1");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const handleTabChange = (key) => {
    setActiveKey(key);
    window.location.hash = tabKeyToHash[key] || "#home";
  };

  return (
    <>
      <Tabs activeKey={activeKey} onChange={handleTabChange}>
        <Tabs.TabPane tab="Home" key="1">
          <Home />
        </Tabs.TabPane>
        <Tabs.TabPane tab="AntdTable" key="2">
          <AntdTable />
        </Tabs.TabPane>
        <Tabs.TabPane tab="ReactHookFormTable" key="3">
          <ReactHookFormTable />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Editable Pro Table" key="4">
          <EditableProTable />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Raw Table Editor" key="5">
          <DataTableEditor />
        </Tabs.TabPane>
      </Tabs>
    </>
  );
}

export default App;
