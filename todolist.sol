// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TodoList {
    struct Task {
        uint256 id;
        string description;
        uint256 createdAt;
        bool completed;
        uint256 completedAt;
    }
    Task[] public tasks; /* array of tasks */
    uint256 public nextId; /* counter too keep track of ID */
    /* events registered on the blockchain */
    event TaskAdded(uint256 id, string description, uint256 createdAt);
    event TaskCompleted(uint256 id, uint256 completedAt);
    /* Add a task */
    function addTask(string memory _description) public {
        tasks.push(Task(nextId, _description, block.timestamp, false, 0));
        emit TaskAdded(nextId, _description, block.timestamp);
        nextId++;
    }
    /* Explain emit and event */
    function completeTask(uint256 _taskId) public {
        require(_taskId < tasks.length, "Invalid task ID");
        require(!tasks[_taskId].completed, "Task already completed");
        tasks[_taskId].completed = true;
        tasks[_taskId].completedAt = block.timestamp;
        emit TaskCompleted(_taskId, block.timestamp);
    }
    function getTasks() public view returns (Task[] memory) {
        return tasks;
    }
}
