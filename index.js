const base_url = "https://cusatapiobj.kerala.gov.in/api";
const loaderContainer = document.querySelector(".loaderContainer");
const loaderText = document.getElementById("loaderText");
const resultDiv = document.getElementById("result");

async function login(register_no) {
  console.log("Logging in...");
  loaderContainer.style.display = "block";
  loaderText.textContent = "Logging in...";

  const url = base_url + "/login";
  const data = { register_no: register_no };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const jsonResponse = await response.json();
    console.log("Logged in!");
    return jsonResponse;
  } catch (error) {
    console.error("Login failed:", error);
    loaderContainer.style.display = "none";
    loaderText.textContent = "";
    resultDiv.innerHTML =
      "Login failed. Please try again after checking register number.";
    resultDiv.classList.add("error");
    throw error; // Re-throw the error to be handled by the caller
  }
}

async function get_questionlist(auth_token, exam_id) {
  console.log("Getting question list...");
  loaderContainer.style.display = "block";
  loaderText.textContent = "Getting question list...";

  const url = base_url + "/questionslist";
  const headers = {
    Authorization: "Bearer " + auth_token,
    "Content-Type": "application/json",
  };
  const data = { examId: exam_id };
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });
    const jsonResponse = await response.json();
    console.log("Got questions!");
    loaderContainer.style.display = "none";
    loaderText.textContent = "";
    return jsonResponse;
  } catch (error) {
    console.error("Failed to get questions:", error);
    loaderContainer.style.display = "none";
    loaderText.textContent = "";
    resultDiv.innerHTML = "Failed to get questions. Please try again.";
    resultDiv.classList.add("error");
    throw error; // Re-throw the error
  }
}

async function main() {
  resultDiv.innerHTML = "";
  resultDiv.className = "";
  try {
    const register_no = document.getElementById("register_no").value.trim();
    const loginResponse = await login(register_no);
    const auth_token = loginResponse["access_token"];
    const exam_id = loginResponse["candidates"]["intExamID"];

    const questionlist = await get_questionlist(auth_token, exam_id);

    let score = 0;
    let total_qs = 0;
    let attempted_qs = 0;
    let correct_qs = 0;
    let incorrect_qs = 0;

    for (const question of questionlist["questions"]) {
      const correct_answer = question["correctAnswer"];
      const selected_answer = question["selectedAnswer"];
      if (typeof correct_answer !== "string" || !/^\d+$/.test(correct_answer)) {
        continue;
      }
      if (selected_answer === null) {
        total_qs += 1;
        continue;
      }
      if (parseInt(correct_answer) === parseInt(selected_answer)) {
        score += 3;
        correct_qs += 1;
      } else {
        score -= 1;
        incorrect_qs += 1;
      }
      attempted_qs += 1;
      total_qs += 1;
    }

    let result = `<strong>Score</strong>: ${score}<br />`;
    result += `<strong>Attempted questions</strong>: ${attempted_qs}<br />`;
    result += `<strong>Correct questions</strong>: ${correct_qs}<br />`;
    result += `<strong>Incorrect questions</strong>: ${incorrect_qs}<br />`;
    result += `<strong>Cancelled questions</strong>: ${225 - total_qs}<br />`;
    result += `<strong>Total Questions</strong>: ${total_qs}<br />`;
    resultDiv.innerHTML = result;
  } catch (error) {
    console.error("An error occurred:", error);
    resultDiv.innerHTML =
      "An error occurred. Please try again after checking your register number.";
  }
}

document.getElementById("calculate").addEventListener("click", main);
