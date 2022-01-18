import { DefaultTaskManager, DefaultTask } from "./indra";

test('construct default tasks manager', () => {
    new DefaultTaskManager()
});

// GetRepresentation(): T

// GetTopGoals(): TaskId[]
// GetTaskDependencies(taskId: TaskId): Result<TaskId[]>
// GetTaskDependees(taskId: TaskId): Result<TaskId[]>
// CanTaskBeDone(taskId: TaskId): Result<boolean>
// GetTaskOrdering(rootTaskId: TaskId): Result<TaskId[]>


test('task calculate lambda', () => {
    const task = new DefaultTask("t", .9, .5)
    const lambda = task.Lambda()
    expect(lambda).toBe(0.2107210313156527)
    const task2 = new DefaultTask("t", .4, 4)
    const lambda2 = task2.Lambda()
    expect(lambda2).toBe(0.22907268296853878)
});

test('put task', () => {
    const dtm = new DefaultTaskManager()
    const task = new DefaultTask("hi", 12, 12)
    const err = dtm.PutTask(task)
    expect(err).toBe(undefined)
});

test('get task', () => {
    const dtm = new DefaultTaskManager()
    const task = new DefaultTask("hi", 12, 12)
    dtm.PutTask(task)
    const taskShould = dtm.GetTask(task.id)
    expect(taskShould).toBe(task)
});

test('remove task no dependencies', () => {
    const dtm = new DefaultTaskManager()
    const task = new DefaultTask("hi", 12, 12)
    let err = dtm.PutTask(task)
    err = dtm.RemoveTask(task.id)
    const taskShould = dtm.GetTask(task.id)
    expect(taskShould).toBe(undefined)
});

test('add dependency', () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .5, 1)
    let err = dtm.PutTask(task1)
    const task2 = new DefaultTask("2", .5, 1)
    err = dtm.PutTask(task2)
    err = dtm.AddDependency(task1.id, task2.id)
    expect(err).toBe(undefined)
    const res1 = dtm.GetTaskDependencies(task1.id)
    expect(res1).toStrictEqual([task2.id])
    const res2 = dtm.GetTaskDependees(task2.id)
    expect(res2).toStrictEqual([task1.id])
});

test('remove dependency', () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .5, 1)
    let err = dtm.PutTask(task1)
    const task2 = new DefaultTask("2", .5, 1)
    err = dtm.PutTask(task2)
    err = dtm.AddDependency(task1.id, task2.id)
    err = dtm.RemoveDependency(task1.id, task2.id)
    expect(err).toBe(undefined)
    const res1 = dtm.GetTaskDependencies(task1.id)
    expect(res1).toStrictEqual([])
    const res2 = dtm.GetTaskDependees(task2.id)
    expect(res2).toStrictEqual([])
});
