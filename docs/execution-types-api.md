# Execution Types API

Parameter             | DataType | Description
----------------------|----------|------------------------------------------------------------
id                    | Guid     | unique id for this object (generated during creation if not provided)
name                  | String   | a name to identify the object
command               | String   | the spark-submit command to run for this execution type
masterUrl             | String   | the master url (eg.  --master) for this execution type
deployMode            | String   | the deploy mode ( eg. --deploy-mode ) for this execution type, options "client", "cluster"
