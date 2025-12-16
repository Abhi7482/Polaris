from pygrabber.dshow_graph import FilterGraph

def list_cameras():
    graph = FilterGraph()
    devices = graph.get_input_devices()
    print(f"Found {len(devices)} devices:")
    for i, device in enumerate(devices):
        print(f"Index {i}: '{device}'")

if __name__ == "__main__":
    list_cameras()
