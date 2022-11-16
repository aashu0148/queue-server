const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const todo = [];
const ongoing = [];
const finished = [];

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Hey" });
});

app.post("/new", (req, res) => {
  const body = req.body || {};
  const { url: urlToReq, id, type } = body;
  if (!urlToReq || !type || !id) {
    res.status(400).json({
      success: false,
      message: `${
        !urlToReq ? "url" : !id ? "id" : !type ? "type" : ""
      } not available`,
    });
    return;
  }

  const reqObj = {
    ...req.body,
    id,
    url: urlToReq,
    type,
    createdAt: new Date(),
  };

  const index = todo.findIndex((item) => item.id == id);
  if (index > -1) {
    res.status(422).json({
      success: false,
      message: `Requeswt already in queue`,
    });
    return;
  }

  todo.push(reqObj);

  res.status(200).json({
    success: true,
    message: "Request added to queue successfully!",
  });
});

app.get("/check-result/:id", (req, res) => {
  const reqId = req.params.id;

  if (!reqId) {
    res.status(400).json({
      success: false,
      message: `Request id not present`,
    });
    return;
  }

  const finishedIndex = finished.findIndex((item) => item.id == reqId);
  if (finishedIndex > -1) {
    const response = finished[finishedIndex];
    finished.splice(finishedIndex, 1);

    res.status(200).json({
      success: true,
      message: `Result found`,
      data: response,
    });
    return;
  }

  const ongoingIndex = ongoing.findIndex((item) => item.id == reqId);
  if (ongoingIndex > -1) {
    res.status(422).json({
      success: false,
      message: `Request is being processed, Please check back later`,
    });
    return;
  }

  const todoIndex = todo.findIndex((item) => item.id == reqId);
  if (todoIndex > -1) {
    res.status(422).json({
      success: false,
      message: `Request is still waiting for its turn`,
    });
    return;
  }

  res.status(404).json({
    success: false,
    message: `No request found with id: ${reqId}`,
  });
});

app.get("/consume", (req, res) => {
  console.log("🐣 Got consume call at - ", new Date().toLocaleString());
  if (todo.length == 0) {
    res.status(422).json({
      success: false,
      message: `Sit back and relax, no requests for now`,
    });
    return;
  }

  const firstTodo = todo[0];
  todo.splice(0, 1);
  ongoing.push(firstTodo);

  res.status(200).json({
    success: true,
    message: "Request found to work on",
    data: firstTodo,
  });
});

app.post("/submit", (req, res) => {
  console.log("✅ Submitting call as on - ", new Date().toLocaleString());
  const { result, id, url } = req.body;

  if (!result || !url || !id) {
    res.status(400).json({
      success: false,
      message: `${
        !result ? "result" : !id ? "id" : !url ? "url" : ""
      } not available`,
    });
    return;
  }

  const ongoingIndex = ongoing.findIndex((item) => item.id == id);
  if (ongoingIndex < 0) {
    res.status(404).json({
      success: false,
      message: "No request found for queuing with this id:" + id,
    });
    return;
  }

  const ongoingReq = ongoing[ongoingIndex];
  ongoing.splice(ongoingIndex, 1);

  if (!req.body.completed) {
    todo.push(ongoingReq);
    res.status(200).json({
      success: true,
      message: "Response recorded",
    });
    return;
  }

  finished.push({
    ...ongoingReq,
    ...req.body,
  });

  res.status(200).json({
    success: true,
    message: "Response recorded",
  });
});

app.get("/queues", (req, res) => {
  const tQ = todo.map((item) => ({ url: item.url, createdAt: item.createdAt }));
  const oQ = ongoing.map((item) => ({
    url: item.url,
    createdAt: item.createdAt,
  }));
  const fQ = finished.map((item) => ({
    url: item.url,
    createdAt: item.createdAt,
  }));

  res.status(200).json({
    success: true,
    data: {
      t: tQ,
      o: oQ,
      f: fQ,
    },
  });
});

app.listen(5000, () => console.log("Server is up at : 5000"));