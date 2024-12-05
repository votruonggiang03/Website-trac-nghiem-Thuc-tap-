// import { Input, message, Spin, Upload } from "antd";
// import { useEffect, useState } from "react";
// import { getQuizzes } from "../../services/apiServices";
// import { useNavigate } from "react-router-dom";
// import { Html5Qrcode } from "html5-qrcode";
// import { InboxOutlined } from "@ant-design/icons";
// import "./Home.scss";

// const { Search } = Input;
// const { Dragger } = Upload;

// const Home = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchValue, setSearchValue] = useState("");
//   const [quizzes, setQuizzes] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchQuizzes = async () => {
//       const data = await getQuizzes();
//       setQuizzes(data.quizzes);
//     };
//     fetchQuizzes();
//   }, []);

//   const handleSearch = (value) => {
//     if (!value) {
//       message.warning("Vui lòng nhập ID bài Quiz!");
//       return;
//     }

//     if (!quizzes || quizzes.length < 1) {
//       message.warning("Không tồn tại bài Quiz nào!");
//       return;
//     }

//     setIsLoading(true);

//     let currentQuiz = quizzes.filter((q) => q._id === value);

//     if (!currentQuiz || currentQuiz.length !== 1) {
//       setIsLoading(false);
//       message.error(`Không tồn tại bài Quiz có ID là: ${value}`);
//       return;
//     }

//     currentQuiz = currentQuiz[0];

//     setTimeout(() => {
//       setIsLoading(false);
//       message.success(`Tìm kiếm thành công với ID: ${value}`);
//       navigate(`/home-exam/${value}`, {
//         state: currentQuiz,
//       });
//     }, 3000);
//   };

//   const handleQRCodeScan = async (file) => {
//     // Kiểm tra định dạng file
//     const supportedFormats = ["image/png", "image/jpeg", "image/webp"];
//     if (!supportedFormats.includes(file.type)) {
//       message.error("Chỉ hỗ trợ các định dạng ảnh PNG, JPEG, hoặc WEBP.");
//       return;
//     }

//     // Tạo container cho Html5Qrcode nếu chưa tồn tại
//     const qrContainerId = "qr-reader-temp";
//     let qrContainer = document.getElementById(qrContainerId);
//     if (!qrContainer) {
//       qrContainer = document.createElement("div");
//       qrContainer.id = qrContainerId;
//       qrContainer.style.display = "none"; // Ẩn container để tránh hiển thị không cần thiết
//       document.body.appendChild(qrContainer);
//     }

//     const html5QrCode = new Html5Qrcode(qrContainerId);

//     try {
//       // Quét file trực tiếp
//       const result = await html5QrCode.scanFile(file, true);
//       const data = result.split("/");
//       // message.success(`Mã QR đã được quét: ${data[data.length - 1]}`);
//       handleSearch(data[data.length - 1]); // Tự động tìm kiếm với ID từ mã QR
//     } catch (err) {
//       message.error("Không thể đọc mã QR từ ảnh đã tải lên.");
//     } finally {
//       html5QrCode.clear(); // Dọn dẹp tài nguyên
//     }
//   };

//   return (
//     <div className="home-container">
//       <h1 className="title">Tìm kiếm bài Quiz</h1>

//       <div className="search-wrapper">
//         <Search
//           className="search-input"
//           placeholder="Nhập ID bài Quiz"
//           enterButton="Tìm"
//           size="large"
//           loading={isLoading}
//           onSearch={handleSearch}
//           value={searchValue}
//           onChange={(e) => setSearchValue(e.target.value)}
//         />
//       </div>

//       {isLoading && (
//         <div className="spin-wrapper">
//           <Spin size="large" />
//         </div>
//       )}

//       <div className="upload-wrapper">
//         <Dragger
//           name="file"
//           multiple={false}
//           accept="image/*"
//           customRequest={({ file, onSuccess }) => {
//             handleQRCodeScan(file);
//             onSuccess("ok"); // Đánh dấu tải lên thành công
//           }}
//           showUploadList={false}
//         >
//           <p className="ant-upload-drag-icon upload-icon">
//             <InboxOutlined />
//           </p>
//           <p className="ant-upload-text upload-text">
//             Kéo và thả ảnh chứa mã QR bài thi vào đây hoặc bấm để chuyển tới bài
//             thi
//           </p>
//           {/* <p className="ant-upload-hint upload-hint">
//             Hỗ trợ định dạng ảnh PNG, JPEG, hoặc WEBP. Ảnh cần chứa mã QR hợp
//             lệ.
//           </p> */}
//         </Dragger>
//       </div>
//     </div>
//   );
// };

// export default Home;

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const socket = io("https://quizzlet-19y7.onrender.com/"); // Kết nối tới server

const PlayerPanel = () => {
  const [gameId, setGameId] = useState(""); // ID của trò chơi
  const [username, setUsername] = useState(""); // Tên người chơi
  const [message, setMessage] = useState(""); // Thông báo hiển thị
  const [players, setPlayers] = useState([]); // Danh sách người chơi trong phòng chờ
  const navigate = useNavigate();

  useEffect(() => {
    // Lắng nghe sự kiện cập nhật danh sách người chơi từ server
    socket.on("game-updated", (game) => {
      if (game.gameId === gameId) {
        setPlayers(game.players || []);
        setMessage("Waiting for admin to start the game...");
      }
    });

    // Lắng nghe sự kiện bắt đầu trò chơi
    socket.on("start-game", ({ url }) => {
      setMessage("The game is starting...");
      navigate(url); // Điều hướng đến đường dẫn được gửi từ server
    });

    return () => {
      socket.off("game-updated"); // Dọn sạch sự kiện khi component bị hủy
      socket.off("start-game");
    };
  }, [gameId, navigate]);

  const joinGame = () => {
    if (gameId.trim() && username.trim()) {
      // Gửi thông tin tham gia lên server
      socket.emit("join-game", { gameId, username });
      setMessage(`Joined game ${gameId}. Waiting for admin...`);
    } else {
      setMessage("Please enter a valid Game ID and Username!");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h1>Join Game</h1>
      <div>
        <input
          type="text"
          placeholder="Enter Game ID"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          style={{
            marginBottom: "10px",
            padding: "10px",
            width: "100%",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        <input
          type="text"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            marginBottom: "10px",
            padding: "10px",
            width: "100%",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />
        <button
          onClick={joinGame}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Join Game
        </button>
        <p style={{ marginTop: "10px", color: "red" }}>{message}</p>
      </div>
      {players.length > 0 && (
        <div>
          <h3>Players in the Room:</h3>
          <ul>
            {players.map((player, index) => (
              <li key={index}>{player.username}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PlayerPanel;
