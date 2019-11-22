# Jobs API

Parameter             | DataType | Description
----------------------|----------|------------------------------------------------------------
id                    | Guid     | unique id for this job (generated during creation if not provided)
name                  | String   | a name to identify the job
executionId           | String   | id of the execution object that is being run for this job
classPathList         | Array    | id of classpaths to be included in this job execution
applicationClass      | String   | scala class that is being executed
applicationJar        | String   | the jar file that is being used in the submit call for this job
sparkParameters       | Array    | a list of key value pair spark parameters to be set in this job (eg. executor-memory); includes parameters that are set as part of the spark submit but not included in the --conf
confParameters        | Array    | a list of key value pair configuration parameters to be set when submitting this job; includes any of the --conf parameters
applicationParameters | Array    | a list of application parameters to be set when executing this job; includes any parameters required by the application
activity              | Object   | an object that includes details for the current execution including processId, status, description, and spark ui link



