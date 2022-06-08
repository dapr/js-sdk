/*
Copyright 2022 The Dapr Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

export default interface ActorReminderInterface {
    /**
     * Initialize a reminder.
     * @param reminderName The name of the reminder.
     * @param dueTimeSeconds Time in seconds when the reminder should is first due.
     * @param periodSeconds Time in seconds between subsequent reminders.
     * @param ttlSeconds Time in seconds after which the reminder is deleted.
     */
    init(reminderName: string,  dueTimeSeconds: number, periodSeconds: number, ttlSeconds: number): Promise<string>;

    /**
     * Stop a reminder if it is running.
     */
    stop(): Promise<void>
}