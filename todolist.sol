// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TodoList {
    struct Task {
        uint256 id;
        string description;
        uint256 createdAt;
        bool completed;
        uint256 completedAt;
        bool isPrivate;
        address owner;
    }
    
    Task[] public tasks;
    uint256 public nextId;
    
    event TaskAdded(uint256 id, string description, uint256 createdAt, bool isPrivate);
    event TaskCompleted(uint256 id, uint256 completedAt);
    
    function addTask(string memory _description, bool _isPrivate) public {
        tasks.push(Task(nextId, _description, block.timestamp, false, 0, _isPrivate, msg.sender));
        emit TaskAdded(nextId, _description, block.timestamp, _isPrivate);
        nextId++;
    }
    
    function completeTask(uint256 _taskId) public {
        require(_taskId < tasks.length, "Invalid task ID");
        require(!tasks[_taskId].completed, "Task already completed");
        
        // Only owner can complete private tasks
        if (tasks[_taskId].isPrivate) {
            require(tasks[_taskId].owner == msg.sender, "Only owner can complete private task");
        }
        
        tasks[_taskId].completed = true;
        tasks[_taskId].completedAt = block.timestamp;
        emit TaskCompleted(_taskId, block.timestamp);
    }
    
    function getTasks() public view returns (Task[] memory) {
        // Create a new array of the same length (worst case)
        Task[] memory visible = new Task[](tasks.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < tasks.length; i++) {
            // Only add if public OR owned by caller
            if (!tasks[i].isPrivate || tasks[i].owner == msg.sender) {
                visible[count] = tasks[i];
                count++;
            }
        }
        
        // Resize array to remove empty slots
        assembly {
            mstore(visible, count)
        }
        
        return visible;
    }
}
