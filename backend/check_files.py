import os

def list_files(startpath):
    for root, dirs, files in os.walk(startpath):
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        print('{}{}/'.format(indent, os.path.basename(root)))
        for f in files:
            print('{}{}'.format(indent + '    ', f))

if __name__ == "__main__":
    print("Listing assets/frames:")
    if os.path.exists("assets/frames"):
        list_files("assets/frames")
    else:
        print("assets/frames directory not found!")
