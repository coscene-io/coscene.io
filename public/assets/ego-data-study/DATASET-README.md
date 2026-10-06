---
license: apache-2.0
task_categories:
  - robotics
tags:
  - LeRobot
  - robotics
  - egocentric
  - hand-tracking
  - manus-gloves
  - imitation-learning
---

# manus-egocentric-sample

Egocentric video dataset with Manus glove hand tracking data, converted to LeRobot v3.0 format.

## Dataset Description

This dataset contains egocentric (first-person view) recordings of human hands performing various manipulation tasks, captured with:
- **Manus Metagloves**: High-precision finger tracking (~70Hz)
- **OAK-D Camera**: RGB video (1920x1080, 30fps) + Depth (640x400, 30fps)
- **IMU**: Accelerometer and gyroscope data

### Dataset Statistics

| Property | Value |
|----------|-------|
| Total Episodes | 20 |
| Total Frames | 96,544 |
| FPS | 30 |
| Robot Type | manus_gloves |
| LeRobot Version | v2.1 |
| Dataset Size | ~15.3 GB |

### Tasks

`Pick_and_pack_task`, `fold_laundry`

### Features

| Feature | Type | Shape |
|---------|------|-------|
| `episode_index` | int64 | [1] |
| `frame_index` | int64 | [1] |
| `timestamp` | float32 | [1] |
| `task_index` | int64 | [1] |
| `observation.images.egocentric` | video | [1080, 1920, 3] |
| `observation.state.hand_joints` | float32 | [150] |
| `observation.state.finger_angles` | float32 | [40] |
| `observation.state.gestures` | float32 | [26] |
| `observation.state.imu` | float32 | [6] |


### Depth Data

This dataset includes raw depth data as a custom extension (LeRobot v3.0 doesn't officially support depth yet).

| Property | Value |
|----------|-------|
| Format | Raw uint16 binary |
| Resolution | [400, 640] (H, W) |
| Unit | millimeters |
| Episodes with depth | 17 |
| Storage | Episode-based (`depth/episode_XXXXXX.bin`) |

To load depth data:
```python
import numpy as np

def load_depth(dataset_path, episode_index):
    depth_path = dataset_path / f"depth/episode_{episode_index:06d}.bin"
    if depth_path.exists():
        data = np.fromfile(depth_path, dtype=np.uint16)
        # Reshape based on frame count (need timestamps)
        return data
    return None
```


## Usage

### Load with LeRobot

```python
from lerobot.datasets.lerobot_dataset import LeRobotDataset

dataset = LeRobotDataset("opengraph-labs/manus-egocentric-sample")

# Access a sample
sample = dataset[0]
print(sample.keys())
# dict_keys(['observation.images.egocentric', 'observation.state.hand_joints', ...])

# Get hand joint positions (25 joints x 3 coords x 2 hands = 150 dims)
hand_joints = sample["observation.state.hand_joints"]
print(hand_joints.shape)  # torch.Size([150])
```

### Data Structure

```
manus-egocentric-sample/
├── meta/
│   ├── info.json           # Dataset schema and features
│   ├── stats.json          # Feature statistics (mean/std/min/max)
│   ├── tasks.jsonl         # Task definitions
│   ├── episodes.jsonl      # Episode metadata
│   └── episodes/           # Episode info (parquet)
├── data/chunk-XXX/         # Time-series data (parquet)
├── videos/                 # RGB video (mp4)
└── depth/                  # Raw depth data (uint16 binary)
```

## Hand Skeleton Structure

Each hand has 25 tracked joints:

```
Hand (Root)
├── Thumb: MCP → PIP → DIP → TIP (4 joints)
├── Index: MCP → IP → PIP → DIP → TIP (5 joints)
├── Middle: MCP → IP → PIP → DIP → TIP (5 joints)
├── Ring: MCP → IP → PIP → DIP → TIP (5 joints)
└── Pinky: MCP → IP → PIP → DIP → TIP (5 joints)
```

## Citation

If you use this dataset, please cite:

```bibtex
@dataset{manus_egocentric_2025,
  title = {Manus Egocentric Hand Tracking Dataset},
  author = {OpenGraph Labs},
  year = {2025},
  publisher = {Hugging Face},
  url = {https://huggingface.co/datasets/opengraph-labs/manus-egocentric-sample}
}
```

## License

This dataset is released under the Apache 2.0 License.
