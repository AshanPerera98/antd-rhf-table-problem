import React, { useRef, useState, useEffect } from "react";
import { uploadCSV } from "../utils/csv-upload";
import { downloadCSV } from "../utils/csv-download";
import { Button, Table, Input, Select, Checkbox, Form } from "antd";

const genderOptions = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
];

const AntdTable = () => {
  const fileInputRef = useRef();
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [form] = Form.useForm();

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
      title: (
        <Checkbox
          checked={
            selectedRowKeys.length ===
              data.filter((row) => {
                const rowErrors = form
                  .getFieldsError()
                  .filter(
                    (err) =>
                      Array.isArray(err.name) &&
                      err.name[0] === row.key &&
                      err.errors.length > 0,
                  );
                return rowErrors.length === 0;
              }).length && data.length > 0
          }
          indeterminate={
            selectedRowKeys.length > 0 &&
            selectedRowKeys.length <
              data.filter((row) => {
                const rowErrors = form
                  .getFieldsError()
                  .filter(
                    (err) =>
                      Array.isArray(err.name) &&
                      err.name[0] === row.key &&
                      err.errors.length > 0,
                  );
                return rowErrors.length === 0;
              }).length
          }
          onChange={(e) => {
            if (e.target.checked) {
              // Only select valid rows
              const validKeys = data
                .filter((row) => {
                  const rowErrors = form
                    .getFieldsError()
                    .filter(
                      (err) =>
                        Array.isArray(err.name) &&
                        err.name[0] === row.key &&
                        err.errors.length > 0,
                    );
                  return rowErrors.length === 0;
                })
                .map((row) => row.key);
              setSelectedRowKeys(validKeys);
            } else {
              setSelectedRowKeys([]);
            }
          }}
        />
      ),
      dataIndex: "select",
      width: 50,
      render: (_, record) => {
        // Check if any field in this row has an error
        const rowErrors = form
          .getFieldsError()
          .filter(
            (err) =>
              Array.isArray(err.name) &&
              err.name[0] === record.key &&
              err.errors.length > 0,
          );
        const hasError = rowErrors.length > 0;
        return (
          <Checkbox
            checked={selectedRowKeys.includes(record.key)}
            disabled={hasError}
            onChange={(e) => {
              setSelectedRowKeys((keys) =>
                e.target.checked
                  ? [...keys, record.key]
                  : keys.filter((k) => k !== record.key),
              );
            }}
          />
        );
      },
    },
    {
      title: "ID",
      dataIndex: "id",
      render: (text, record) => (
        <Form.Item
          name={[record.key, "id"]}
          rules={[
            { required: true, message: "ID is required" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                // Check for duplicate IDs in the data array
                const idCount = data.filter((row) => row.id === value).length;
                if (idCount > 1) {
                  return Promise.reject(new Error("ID must be unique"));
                }
                return Promise.resolve();
              },
            },
          ]}
          style={{ margin: 0 }}
          initialValue={text}
        >
          <Input
            value={text}
            onChange={(e) => handleInputChange(e.target.value, record, "id")}
          />
        </Form.Item>
      ),
    },
    {
      title: "First Name",
      dataIndex: "first_name",
      render: (text, record) => (
        <Form.Item
          name={[record.key, "first_name"]}
          rules={[
            { required: true, message: "First name is required" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const comboCount = data.filter(
                  (row) =>
                    row.first_name === value &&
                    row.last_name === record.last_name &&
                    row.key !== record.key,
                ).length;
                if (comboCount > 0) {
                  return Promise.reject(
                    new Error("First and last name combination must be unique"),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
          style={{ margin: 0 }}
          initialValue={text}
        >
          <Input
            value={text}
            onChange={(e) =>
              handleInputChange(e.target.value, record, "first_name")
            }
          />
        </Form.Item>
      ),
    },
    {
      title: "Last Name",
      dataIndex: "last_name",
      render: (text, record) => (
        <Form.Item
          name={[record.key, "last_name"]}
          rules={[
            { required: true, message: "Last name is required" },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const comboCount = data.filter(
                  (row) =>
                    row.last_name === value &&
                    row.first_name === record.first_name &&
                    row.key !== record.key,
                ).length;
                if (comboCount > 0) {
                  return Promise.reject(
                    new Error("First and last name combination must be unique"),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
          style={{ margin: 0 }}
          initialValue={text}
        >
          <Input
            value={text}
            onChange={(e) =>
              handleInputChange(e.target.value, record, "last_name")
            }
          />
        </Form.Item>
      ),
    },
    {
      title: "Age",
      dataIndex: "age",
      render: (text, record) => (
        <Form.Item
          name={[record.key, "age"]}
          rules={[
            { required: true, message: "Age is required" },
            {
              validator: (_, value) => {
                if (value === undefined || value === null || value === "")
                  return Promise.resolve();
                if (isNaN(Number(value)) || Number(value) <= 0) {
                  return Promise.reject(
                    new Error("Age must be greater than 0"),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
          style={{ margin: 0 }}
          initialValue={text}
        >
          <Input
            type="number"
            min={1}
            value={text}
            onChange={(e) => handleInputChange(e.target.value, record, "age")}
          />
        </Form.Item>
      ),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      render: (text, record) => (
        <Form.Item
          name={[record.key, "gender"]}
          rules={[{ required: true, message: "Gender is required" }]}
          style={{ margin: 0 }}
          initialValue={text}
        >
          <Select
            value={text}
            style={{ width: 100 }}
            onChange={(value) => handleInputChange(value, record, "gender")}
            options={genderOptions}
          />
        </Form.Item>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => {
        const rowErrors = form
          .getFieldsError()
          .filter(
            (err) =>
              Array.isArray(err.name) &&
              err.name[0] === record.key &&
              err.errors.length > 0,
          );
        const hasError = rowErrors.length > 0;
        const handleAdd = () => {
          // Log the row's data
          console.log("Add row data:", record);
        };
        return (
          <Button type="primary" disabled={hasError} onClick={handleAdd}>
            Add
          </Button>
        );
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
        <Form form={form} component={false} preserve={true}>
          <Table
            dataSource={data}
            columns={columns}
            bordered
            pagination={{
              pageSizeOptions: ["10", "20", "50", "100"],
              showSizeChanger: true,
              defaultPageSize: 10,
            }}
            rowKey="key"
            virtual={true}
          />
        </Form>
      </div>
    </div>
  );
};

export default AntdTable;
