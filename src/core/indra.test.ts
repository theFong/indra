import { assert } from "console";
import { DefaultTaskManager, DefaultTask } from "./indra";

test('construct default tasks manager', () => {
    new DefaultTaskManager()
});



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

test('get representation', () => {
    const dtm = new DefaultTaskManager()
    const r1 = dtm.GetRepresentation()
    expect(r1).toStrictEqual({})
    const task1 = new DefaultTask("1", .5, 1)
    dtm.PutTask(task1)
    const r2 = dtm.GetRepresentation()
    const correct: any = {}
    correct[task1.id] = {
        "dependees": new Set(),
        "dependencies": new Set(),
    }
    expect(r2).toStrictEqual(correct)
})

test('get top goals', () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .5, 1)
    dtm.PutTask(task1)
    const g = dtm.GetTopGoals()
    expect(g).toStrictEqual([task1.id])

    const task2 = new DefaultTask("2", .5, 1)
    dtm.PutTask(task2)
    dtm.AddDependency(task1.id, task2.id)
    const g2 = dtm.GetTopGoals()
    expect(g2).toStrictEqual([task1.id])
})

test('get task dependencies', () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .5, 1)
    dtm.PutTask(task1)

    const task2 = new DefaultTask("2", .5, 1)
    dtm.PutTask(task2)
    dtm.AddDependency(task1.id, task2.id)

    const res = dtm.GetTaskDependencies(task1.id)
    if ("length" in res) {
        expect(res).toStrictEqual([task2.id])
    } else {
        fail()
    }
})

test('get task dependees', () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .5, 1)
    dtm.PutTask(task1)

    const task2 = new DefaultTask("2", .5, 1)
    dtm.PutTask(task2)
    dtm.AddDependency(task1.id, task2.id)

    const res = dtm.GetTaskDependees(task2.id)
    expect(res).toStrictEqual([task1.id])
})

test("can task be done", () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .5, 1)
    dtm.PutTask(task1)

    const task2 = new DefaultTask("2", .5, 1)
    dtm.PutTask(task2)
    dtm.AddDependency(task1.id, task2.id)

    const t1Res = dtm.CanTaskBeDone(task1.id)
    expect(t1Res).toBe(false)

    const t2Res = dtm.CanTaskBeDone(task2.id)
    expect(t2Res).toBe(true)
})


test("get task ordering trival", () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .5, 1)
    dtm.PutTask(task1)

    const task2 = new DefaultTask("2", .5, 1)
    dtm.PutTask(task2)
    dtm.AddDependency(task1.id, task2.id)

    const ordering1 = dtm.GetTaskOrdering(task1.id)
    expect(ordering1).toStrictEqual([task2.id, task1.id])
})

test("get task ordering simple", () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .5, 1)
    task1.id = "1"
    dtm.PutTask(task1)

    const task2 = new DefaultTask("2", .5, 1)
    task2.id = "2"
    dtm.PutTask(task2)
    dtm.AddDependency(task1.id, task2.id)

    const task3 = new DefaultTask("3", .1, 1)
    task3.id = "3"
    dtm.PutTask(task3)
    dtm.AddDependency(task1.id, task3.id)

    const ordering = dtm.GetTaskOrdering(task1.id)
    expect(ordering).toStrictEqual([task3.id, task2.id, task1.id])
})

test("get task take biggest lambda", () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .9, 1)
    dtm.PutTask(task1)

    const task2 = new DefaultTask("2", .9, 1)
    dtm.PutTask(task2)
    dtm.AddDependency(task1.id, task2.id)


    const task3 = new DefaultTask("3", .8, 1)
    dtm.PutTask(task3)
    dtm.AddDependency(task2.id, task3.id)

    const task4 = new DefaultTask("4", .8, 1)
    dtm.PutTask(task4)
    dtm.AddDependency(task3.id, task4.id)

    const task5 = new DefaultTask("5", .8, 1)
    dtm.PutTask(task5)
    dtm.AddDependency(task4.id, task5.id)

    const ordering = dtm.GetTaskOrdering(task1.id)
    expect(ordering).toStrictEqual([task5.id, task4.id, task3.id, task2.id, task1.id])
})

test("get task don't take biggest lambda", () => {
    const dtm = new DefaultTaskManager()
    const task1 = new DefaultTask("1", .9, 1)
    dtm.PutTask(task1)

    const task2 = new DefaultTask("2", .2, 1)
    dtm.PutTask(task2)
    dtm.AddDependency(task1.id, task2.id)


    const task3 = new DefaultTask("3", .1, 1)
    dtm.PutTask(task3)
    dtm.AddDependency(task1.id, task3.id)

    const task4 = new DefaultTask("4", .9, 1)
    dtm.PutTask(task4)
    dtm.AddDependency(task3.id, task4.id)

    const ordering = dtm.GetTaskOrdering(task1.id)
    expect(ordering).toStrictEqual([task4.id, task3.id, task2.id, task1.id])
})