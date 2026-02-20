import React, { useRef, useState, useEffect } from "react";
import { uploadCSV } from "../utils/csv-upload";
import { downloadCSV } from "../utils/csv-download";
import { Button, Input, Select, Checkbox, Form } from "antd";
import { EditableProTable as AntdEditableProTaable } from "@ant-design/pro-components";

const genderOptions = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
];

const EditableProTable = () => {
  const fileInputRef = useRef();
  const [data, setData] = useState([]);
  const [editableKeys, setEditableKeys] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (data.length > 0) {
      setEditableKeys(data.map((item) => item.key));
    }
  }, [data]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    uploadCSV(file, setData);
  };

  // Validate all fields on initial render and whenever data changes
  useEffect(() => {
    if (data.length > 0) {
      // Set all form values to current data
      const values = {};
      data.forEach((row) => {
        values[row.key] = row;
      });
      form.setFieldsValue(values);
      // Validate all fields
      form.validateFields();
    }
  }, [data, form]);

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleDownload = () => {
    downloadCSV();
  };

  const handleInputChange = (value, record, dataIndex) => {
    setData((prev) =>
      prev.map((row) =>
        row.key === record.key ? { ...row, [dataIndex]: value } : row,
      ),
    );
    form.setFieldsValue({
      [record.key]: {
        ...record,
        [dataIndex]: value,
      },
    });
  };

  const columns = [
    {
      title: "First Name",
      dataIndex: "first_name",
    },
    {
      title: "Last Name",
      dataIndex: "last_name",
    },
    {
      title: "Age",
      dataIndex: "age",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      valueType: "select",
      valueEnum: {
        M: { text: "Male" },
        F: { text: "Female" },
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 16,
          justifyContent: "space-between",
        }}
      >
        <div>
          <Button
            type="primary"
            style={{ marginRight: 12 }}
            disabled={selectedRowKeys.length === 0}
            onClick={() => {
              const selectedRows = data.filter((row) =>
                selectedRowKeys.includes(row.key),
              );
              console.log("Add All selected rows:", selectedRows);
            }}
          >
            Add All
          </Button>
        </div>
        <div>
          <Button
            type="primary"
            onClick={handleUploadClick}
            style={{ marginRight: 8 }}
          >
            Upload CSV
          </Button>
          <Button onClick={handleDownload} style={{ marginRight: 16 }}>
            Download CSV
          </Button>
        </div>
      </div>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <div style={{ marginTop: 24 }}>
        <AntdEditableProTaable
          headerTitle="Editable Pro Table"
          rowKey="key"
          columns={columns}
          value={data}
          onChange={setData}
          editable={{
            type: "multiple",
            editableKeys,
            onValuesChange: (rowKey, data) => {
              setData(data);
            },
            onChange: setEditableKeys,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            pageSizeOptions: ["10", "20", "50", "100"],
            showSizeChanger: true,
            defaultPageSize: 10,
          }}
        />
      </div>
    </div>
  );
};

export default EditableProTable;
