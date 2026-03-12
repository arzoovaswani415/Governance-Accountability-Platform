import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from processing.state_policy_mapper import map_state_policies_to_national
try:
    map_state_policies_to_national()
except Exception as e:
    import traceback
    traceback.print_exc()
