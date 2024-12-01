from flask import Flask, Response, jsonify
from flask_cors import CORS
import cv2
import torch
import pathlib
import requests
import platform
import warnings
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

if platform.system() == 'Windows':
    pathlib.PosixPath = pathlib.WindowsPath
else:
    pathlib.WindowsPath = pathlib.PosixPath

warnings.filterwarnings("ignore", category=FutureWarning)

# Initialize Firebase
def initialize_firebase():
    try:
        # Path to your Firebase service account key JSON file
        cred = credentials.Certificate('embreddedproject-firebase-adminsdk-fmxxw-c296098f9f.json')
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://embreddedproject-default-rtdb.asia-southeast1.firebasedatabase.app/'
        })
        print("Firebase initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        raise

# Initialize Firebase on startup
initialize_firebase()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize YOLOv5 model
model_path = pathlib.Path(r"best_v200.pt").resolve()
model_path = str(model_path)
try:
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=model_path, force_reload=True)
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")
    exit()

# Line Notify function (optional for sending alerts)
LINE_TOKEN = "xVKToYyNrrXilrxvL71rmaFpl9CrHrRR3IA8FqnsZd0"  # Replace with your Line Notify token
url = "https://notify-api.line.me/api/notify"
headers = {"Authorization": f"Bearer {LINE_TOKEN}"}

def line_Notify(text="Insect detected"):
    data = {"message": text}  
    response = requests.post(url, headers=headers, data=data)
    if response.status_code == 200:
        print("Notification sent successfully!")
    else:
        print(f"Error sending notification: {response.status_code}")

# Start capturing video from webcam
cap = cv2.VideoCapture(0)
if not cap.isOpened():
    print("Error: Could not open webcam.")
    exit()

# Function to fetch data from Firebase
def fetch_firebase_data():
    try:
        # Reference to the path you want to read from
        ref = db.reference('/')
        # Fetch the data
        data = ref.get()
        return data
    except Exception as e:
        print(f"Error fetching Firebase data: {e}")
        return None


# Function to generate video frames
def generate_frames():
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab frame.")
            break
        
        # Object detection with YOLOv5
        results = model(frame)
        detected_objects = results.pandas().xyxy[0]
        
        # Filter for insect detections (based on class name and confidence)
        insects = detected_objects[(detected_objects['name'] == 'insect') & (detected_objects['confidence'] > 0.6)]
        
        # Send Line notification and update Firebase if insect detected
        if not insects.empty:
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Prepare detection data for Firebase
            detection_data = {
                'timestamp': current_time,
                'count': len(insects),
                'details': insects.to_dict('records')
            }
            
            # Send Line notification
            line_Notify()
            print(f"Insect detected at {current_time}!")
        
        # Draw bounding boxes around detected insects
        for _, row in insects.iterrows():
            x1, y1, x2, y2 = int(row['xmin']), int(row['ymin']), int(row['xmax']), int(row['ymax'])
            label = f"{row['name']} {row['confidence']:.2f}"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        
        # Convert frame to JPEG and stream it to the client
        ret, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# Route to fetch Firebase data
@app.route('/get_firebase_data')
def get_firebase_data():
    data = fetch_firebase_data()
    client_sensor = data['Client']['SensorData']
    last_key = next(iter(reversed(client_sensor)))
    last_value = client_sensor[last_key]
    server_sensor = data['Server']['SensorData']
    _last_key = next(iter(reversed(server_sensor)))
    _last_value = server_sensor[_last_key]
    concat_data = {"Client": last_value, "Server": _last_value}
    return jsonify(concat_data) if concat_data else jsonify({"error": "No data found"})

@app.route('/get_firebase_logs')
def get_firebase_logs():
    data = fetch_firebase_data()
    client_sensor = data['Client']['SensorData']
    client_sensor_list = []
    for e in client_sensor :
        client_sensor_list.append(client_sensor[e])
    client_sensor_list = sorted(client_sensor_list, key=lambda x: int(x['timestamp']), reverse=True)

    server_sensor = data['Server']['SensorData']
    server_sensor_list = []
    for e in server_sensor :
        server_sensor_list.append(server_sensor[e])
    server_sensor_list = sorted(server_sensor_list, key=lambda x: int(x['timestamp']), reverse=True)

    concat_data = {"Client": client_sensor_list[:10], "Server": server_sensor_list[:10]}
    return jsonify(concat_data) if concat_data else jsonify({"error": "No data found"})


# Route for streaming video feed
@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# Start Flask server
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)