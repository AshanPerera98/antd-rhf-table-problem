import React from "react";

const Home = () => {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: "auto",
        padding: "32px",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 32px 0 rgba(0,0,0,0.08)",
        textAlign: "left",
        fontFamily: "Segoe UI, Arial, sans-serif",
        color: "#222",
      }}
    >
      <h1
        style={{
          fontSize: 36,
          fontWeight: 800,
          marginBottom: 12,
          color: "#1890ff",
          letterSpacing: 1,
        }}
      >
        Welcome to the Problem Demo
      </h1>
      <p style={{ fontSize: 18, marginBottom: 18, lineHeight: 1.7 }}>
        This application showcases two advanced editable table solutions for
        managing CSV data, allowing you to compare the strengths and developer
        ergonomics of <b>Ant Design Form</b> and <b>React Hook Form</b> in a
        real-world scenario.
        <br />
        <br />
        <b>Note:</b> This demo specifically highlights an issue I have
        encountered when running multiple complicated validations in form tables
        using both Ant Design and React Hook Form.
        <br />
        <br />I havn't add any optimizations to the tables like memoization,
        virtualization, or debouncing to ensure that the performance issue is
        clearly visible when running multiple validations on a large dataset.
        The issue is that when you have a large dataset and run multiple
        validations, the UI becomes unresponsive and the performance degrades
        significantly. The issue is more pronounced when you increaese the
        number of rows in a single page in the paginated table. My real world
        usecase needs atleast 100 rows in a single page and the performance
        becomes unacceptable when running multiple validations on that many
        rows.
      </p>
      <ol
        style={{
          fontSize: 17,
          marginBottom: 18,
          paddingLeft: 24,
          lineHeight: 1.7,
        }}
      >
        <li>
          <b>AntdTable</b>: Utilizes Ant Design's <code>Form</code> and{" "}
          <code>Table</code> components. All validation, error display, and
          state management are handled using Ant Design's form system.
        </li>
        <li>
          <b>ReactHookFormTable</b>: Implements the same table and validation
          logic using <code>react-hook-form</code>, a popular library for
          performant and flexible form state management in React.
        </li>
      </ol>
      <div
        style={{
          margin: "40px 0 24px 0",
          padding: "16px 24px",
          background: "linear-gradient(90deg, #e3f1ff 0%, #bae7ff 100%)",
          border: "1.5px solid #1890ff",
          borderRadius: 10,
          textAlign: "center",
          fontSize: 18,
          fontWeight: 500,
          boxShadow: "0 1px 8px 0 rgba(24,144,255,0.08)",
        }}
      >
        <span role="img" aria-label="github">
          🐙
        </span>
        &nbsp;Check out the project repo on&nbsp;
        <a
          href="https://github.com/AshanPerera98/antd-rhf-table-problem"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#096dd9",
            textDecoration: "underline",
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          GitHub
        </a>
        &nbsp;
        <span role="img" aria-label="link">
          🔗
        </span>
      </div>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 700,
          margin: "32px 0 10px 0",
          color: "#52c41a",
          letterSpacing: 0.5,
        }}
      >
        How to Use
      </h2>
      <ol
        style={{
          fontSize: 16,
          marginBottom: 18,
          paddingLeft: 24,
          lineHeight: 1.7,
        }}
      >
        <li>
          <b>Download CSV:</b> At any time, you can download the mock CSV file
          by clicking the <b>Download CSV</b> button.
        </li>
        <li>
          <b>Upload CSV:</b> Click <b>Upload CSV</b> to import your data. The
          table will populate with the uploaded rows, each row becoming
          editable.
        </li>
        <li>
          <b>Edit Data:</b> You can edit any cell directly. All changes are
          validated in real time. Invalid fields are highlighted and display
          error messages.
        </li>
        <li>
          <b>Validation Rules:</b>
          <ul
            style={{
              marginTop: 8,
              marginBottom: 8,
              paddingLeft: 20,
              fontSize: 15,
              color: "#444",
            }}
          >
            <li>
              <b>ID</b> is required and must be unique across all rows.
            </li>
            <li>
              <b>First Name</b> and <b>Last Name</b> are both required, and
              their combination must be unique (no two rows can have the same
              first and last name pair).
            </li>
            <li>
              <b>Age</b> is required and must be a number greater than 0.
            </li>
            <li>
              <b>Gender</b> is required and must be selected from the dropdown.
            </li>
          </ul>
        </li>
        <li>
          Validations must run in the initial load, on every input change, and
          when changing pages (paginating). This ensures that the user always
          has accurate feedback on the validity of their data, regardless of how
          they interact with the table.
        </li>
        <li>
          <b>Row Selection:</b> You can select rows using the checkboxes. Only
          rows that pass all validation rules can be selected. The{" "}
          <b>Select All</b> checkbox will only select all valid rows on the
          current page.
        </li>
        <li>
          <b>Actions:</b> Each row has an <b>Add</b> button (enabled only if the
          row is valid) to log that row's data. The <b>Add All</b> button above
          the table logs all selected valid rows at once.
        </li>
        <li>
          <b>Pagination:</b> Use the pagination controls to view and edit large
          datasets efficiently. Validation and selection are preserved across
          pages.
        </li>
      </ol>
      <div style={{ marginTop: 32, display: "flex", gap: 16 }}>
        <button
          style={{
            padding: "10px 28px",
            fontSize: 17,
            fontWeight: 600,
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(90deg, #1890ff 0%, #40a9ff 100%)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 2px 8px 0 rgba(24,144,255,0.10)",
            transition: "background 0.2s",
          }}
          onClick={() => {
            window.location.hash = "#antd";
          }}
        >
          Go to Antd Table
        </button>
        <button
          style={{
            padding: "10px 28px",
            fontSize: 17,
            fontWeight: 600,
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(90deg, #52c41a 0%, #73d13d 100%)",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 2px 8px 0 rgba(82,196,26,0.10)",
            transition: "background 0.2s",
          }}
          onClick={() => {
            window.location.hash = "#rhf";
          }}
        >
          Go to RHF Table
        </button>
      </div>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          margin: "36px 0 10px 0",
          color: "#faad14",
          letterSpacing: 0.5,
        }}
      >
        Community Invitation
      </h2>
      <p style={{ fontSize: 17, marginBottom: 18, lineHeight: 1.7 }}>
        <b>Calling all developers!</b> If you have insights, improvements, or
        alternative solutions for handling complex validation in dynamic form
        tables with Ant Design or React Hook Form, you are warmly invited to
        explore this problem and contribute directly to this repository. Please
        feel free to fork, experiment, and submit your own fixes or enhancements
        via pull requests.
        <br />
        <br />
        Your feedback, code contributions, and shared experiences will help make
        this a valuable resource for others facing similar challenges in the
        React ecosystem.
      </p>
      <div
        style={{
          marginTop: 48,
          padding: "20px 28px",
          background: "linear-gradient(90deg, #fff6b7 0%, #f6416c 100%)",
          color: "#222",
          borderRadius: 14,
          fontWeight: 700,
          fontSize: 22,
          textAlign: "center",
          letterSpacing: 1,
          boxShadow: "0 2px 16px 0 rgba(246,65,108,0.10)",
        }}
      >
        <span role="img" aria-label="sparkles">
          ✨
        </span>
        <span style={{ margin: "0 14px" }}>
          Thank you for exploring, contributing, and making the React community
          better!
        </span>
        <span role="img" aria-label="rocket">
          🚀
        </span>
        <span role="img" aria-label="heart">
          💛
        </span>
      </div>
    </div>
  );
};

export default Home;
