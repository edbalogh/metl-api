# Executions API

Parameter                    | DataType | Description
-----------------------------|----------|------------------------------------------------------------
id                           | Guid     | unique id for this object (generated during creation if not provided)
name                         | String   | a name to identify the object
executionSettingsId          | String   | id of the execution-type object that is being used for these settings
defaultSparkParameters       | Array    | a list of key value pair for default/recommended spark parameters for this config (eg. executor-memory); includes parameters that are set as part of the spark submit but not included in the --conf
defaultConfParameters        | Array    | a list of key value pair for default/recommended configuration parameters for config; includes any of the --conf parameters


The default parameters are recommendations that can be overridden at job submission and should only include settings that are meaningful in this context (and not specific executions)
