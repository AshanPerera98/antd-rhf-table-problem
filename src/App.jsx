import "./App.css";
import { Tabs } from "antd";
import Home from "./home/home";
import AntdTable from "./antd-table/antd-table";
import ReactHookFormTable from "./rhf-table/rhf-table";

import React, { useState, useEffect } from "react";

const tabKeyToHash = {
  1: "#home",
  2: "#antd",
  3: "#rhf",
};
const hashToTabKey = {
  "#home": "1",
  "#antd": "2",
  "#rhf": "3",
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
      </Tabs>
    </>
  );
}

export default App;
